import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../healthCheck";

// Mock the logger
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Health Check Handler", () => {
  const mockEvent: Partial<APIGatewayProxyEvent> = {
    requestContext: {
      identity: {
        sourceIp: "127.0.0.1",
      },
    } as any,
  };

  const mockContext: Partial<Context> = {
    awsRequestId: "test-request-id",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "test";
  });

  it("should return a successful health check response", async () => {
    const result = await handler(
      mockEvent as APIGatewayProxyEvent,
      mockContext as Context
    );

    expect(result.statusCode).toBe(200);
    expect(result.headers!["Content-Type"]).toBe("application/json");
    expect(result.headers!["Access-Control-Allow-Origin"]).toBe("*");

    const body = JSON.parse(result.body);
    expect(body.status).toBe("healthy");
    expect(body.timestamp).toBeDefined();
    expect(body.version).toBeDefined();
    expect(body.environment).toBe("test");
  });

  it("should include CORS headers", async () => {
    const result = await handler(
      mockEvent as APIGatewayProxyEvent,
      mockContext as Context
    );

    expect(result.headers!["Access-Control-Allow-Origin"]).toBe("*");
    expect(result.headers!["Access-Control-Allow-Headers"]).toBeDefined();
    expect(result.headers!["Access-Control-Allow-Methods"]).toBeDefined();
  });
});
