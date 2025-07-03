import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../userUnsubscribe.js";
import * as jwtAuth from "../../utils/jwtAuth.js";
import { MailerLiteService } from "../../services/mailerLiteService.js";

// Mock dependencies
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../services/mailerLiteService.js");
jest.mock("../../utils/jwtAuth.js");

// Type the mocked modules
const MockedMailerLiteService = MailerLiteService as jest.MockedClass<
  typeof MailerLiteService
>;

describe("userUnsubscribe handler", () => {
  const mockContext: Context = {
    awsRequestId: "test-request-id",
    functionName: "test-function",
    functionVersion: "1",
    invokedFunctionArn: "test-arn",
    memoryLimitInMB: "128",
    logGroupName: "test-log-group",
    logStreamName: "test-log-stream",
    callbackWaitsForEmptyEventLoop: false,
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    process.env.MAILERLITE_API_KEY = "test-api-key";
  });

  afterEach(() => {
    delete process.env.MAILERLITE_API_KEY;
  });

  it("should successfully unsubscribe a user", async () => {
    // Mock JWT verification
    jest
      .spyOn(jwtAuth, "extractTokenFromHeader")
      .mockReturnValue("valid-token");
    jest.spyOn(jwtAuth, "verifyJwtToken").mockResolvedValue(true);

    // Mock MailerLite service
    const mockUpdateSubscriber = jest.fn().mockResolvedValue(undefined);
    MockedMailerLiteService.prototype.updateSubscriber = mockUpdateSubscriber;

    const event: Partial<APIGatewayProxyEvent> = {
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {
        id: "test-subscriber-id",
      },
      requestContext: {
        identity: {
          sourceIp: "127.0.0.1",
        },
      } as any,
    };

    const result = await handler(event as APIGatewayProxyEvent, mockContext);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      success: true,
      message: "User unsubscribed successfully",
      subscriberId: "test-subscriber-id",
    });

    expect(mockUpdateSubscriber).toHaveBeenCalledWith(
      "test-subscriber-id",
      expect.objectContaining({
        status: "unsubscribed",
        unsubscribed_at: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
        ),
      })
    );
  });

  it("should return 401 when no JWT token is provided", async () => {
    jest.spyOn(jwtAuth, "extractTokenFromHeader").mockReturnValue(null);

    const event: Partial<APIGatewayProxyEvent> = {
      headers: {},
      pathParameters: {
        id: "test-subscriber-id",
      },
      requestContext: {
        identity: {
          sourceIp: "127.0.0.1",
        },
      } as any,
    };

    const result = await handler(event as APIGatewayProxyEvent, mockContext);

    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body)).toEqual({
      error: "Unauthorized",
      message: "Authentication token is required",
      timestamp: expect.any(String),
    });
  });

  it("should return 401 when JWT token is invalid", async () => {
    jest
      .spyOn(jwtAuth, "extractTokenFromHeader")
      .mockReturnValue("invalid-token");
    jest.spyOn(jwtAuth, "verifyJwtToken").mockResolvedValue(false);

    const event: Partial<APIGatewayProxyEvent> = {
      headers: {
        Authorization: "Bearer invalid-token",
      },
      pathParameters: {
        id: "test-subscriber-id",
      },
      requestContext: {
        identity: {
          sourceIp: "127.0.0.1",
        },
      } as any,
    };

    const result = await handler(event as APIGatewayProxyEvent, mockContext);

    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body)).toEqual({
      error: "Unauthorized",
      message: "Invalid authentication token",
      timestamp: expect.any(String),
    });
  });

  it("should return 400 when subscriber ID is not provided", async () => {
    jest
      .spyOn(jwtAuth, "extractTokenFromHeader")
      .mockReturnValue("valid-token");
    jest.spyOn(jwtAuth, "verifyJwtToken").mockResolvedValue(true);

    const event: Partial<APIGatewayProxyEvent> = {
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {},
      requestContext: {
        identity: {
          sourceIp: "127.0.0.1",
        },
      } as any,
    };

    const result = await handler(event as APIGatewayProxyEvent, mockContext);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: "Bad Request",
      message: "Subscriber ID is required",
      timestamp: expect.any(String),
    });
  });

  it("should return 404 when subscriber is not found", async () => {
    jest
      .spyOn(jwtAuth, "extractTokenFromHeader")
      .mockReturnValue("valid-token");
    jest.spyOn(jwtAuth, "verifyJwtToken").mockResolvedValue(true);

    const mockUpdateSubscriber = jest
      .fn()
      .mockRejectedValue(new Error("Subscriber not found"));
    MockedMailerLiteService.prototype.updateSubscriber = mockUpdateSubscriber;

    const event: Partial<APIGatewayProxyEvent> = {
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {
        id: "non-existent-id",
      },
      requestContext: {
        identity: {
          sourceIp: "127.0.0.1",
        },
      } as any,
    };

    const result = await handler(event as APIGatewayProxyEvent, mockContext);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({
      error: "Not Found",
      message: "Subscriber not found",
      timestamp: expect.any(String),
    });
  });

  it("should return 500 when MailerLite API key is not configured", async () => {
    delete process.env.MAILERLITE_API_KEY;
    jest
      .spyOn(jwtAuth, "extractTokenFromHeader")
      .mockReturnValue("valid-token");
    jest.spyOn(jwtAuth, "verifyJwtToken").mockResolvedValue(true);

    const event: Partial<APIGatewayProxyEvent> = {
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {
        id: "test-subscriber-id",
      },
      requestContext: {
        identity: {
          sourceIp: "127.0.0.1",
        },
      } as any,
    };

    const result = await handler(event as APIGatewayProxyEvent, mockContext);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: "Internal Server Error",
      message: "Service configuration error",
      timestamp: expect.any(String),
    });
  });
});
