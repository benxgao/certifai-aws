import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../userJoinGrop";
import * as jwtAuth from "../../utils/jwtAuth";
import * as mailerLiteService from "../../services/mailerLiteService";

// Mock the dependencies
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../services/mailerLiteService");
jest.mock("../../utils/jwtAuth");

describe("UserJoinGroup Handler with JWT Protection", () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;
  let mockMailerLiteService: jest.Mocked<mailerLiteService.MailerLiteService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup basic event structure
    mockEvent = {
      headers: {
        Authorization: "Bearer valid-jwt-token",
      },
      body: JSON.stringify({
        email: "test@example.com",
        groupName: "Test Group",
      }),
      requestContext: {
        identity: {
          sourceIp: "127.0.0.1",
        },
      },
    } as any;

    mockContext = {
      awsRequestId: "test-request-id",
    } as any;

    // Setup environment variables
    process.env.MAILERLITE_API_KEY = "test-api-key";
    process.env.MARKETING_API_JWT_SECRET = "test-jwt-secret";

    // Setup MailerLiteService mock
    mockMailerLiteService = {
      getSubscriberByEmail: jest.fn(),
      getGroupByName: jest.fn(),
      addSubscriberToGroup: jest.fn(),
    } as any;

    (
      mailerLiteService.MailerLiteService as jest.MockedClass<
        typeof mailerLiteService.MailerLiteService
      >
    ).mockImplementation(() => mockMailerLiteService);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.MAILERLITE_API_KEY;
    delete process.env.MARKETING_API_JWT_SECRET;
  });

  describe("Authentication", () => {
    it("should return 401 when no Authorization header is provided", async () => {
      mockEvent.headers = {};

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toEqual({
        error: "Unauthorized",
        message: "Authentication token is required",
        timestamp: expect.any(String),
      });
    });

    it("should return 401 when JWT token is invalid", async () => {
      (jwtAuth.extractTokenFromHeader as jest.Mock).mockReturnValue(
        "invalid-token"
      );
      (jwtAuth.verifyJwtToken as jest.Mock).mockResolvedValue(false);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toEqual({
        error: "Unauthorized",
        message: "Invalid authentication token",
        timestamp: expect.any(String),
      });
    });
  });

  describe("Input Validation", () => {
    beforeEach(() => {
      (jwtAuth.extractTokenFromHeader as jest.Mock).mockReturnValue(
        "valid-token"
      );
      (jwtAuth.verifyJwtToken as jest.Mock).mockResolvedValue(true);
    });

    it("should return 400 when request body is empty", async () => {
      mockEvent.body = null;

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: "Bad Request",
        message: "Request body is required",
        timestamp: expect.any(String),
      });
    });

    it("should return 400 when request body is invalid JSON", async () => {
      mockEvent.body = "invalid json";

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: "Bad Request",
        message: "Invalid JSON format",
        timestamp: expect.any(String),
      });
    });

    it("should return 400 when email is missing", async () => {
      mockEvent.body = JSON.stringify({
        groupName: "Test Group",
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: "Bad Request",
        message: "Email is required",
        timestamp: expect.any(String),
      });
    });

    it("should return 400 when email is invalid", async () => {
      mockEvent.body = JSON.stringify({
        email: "invalid-email",
        groupName: "Test Group",
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: "Bad Request",
        message: "Please provide a valid email address",
        timestamp: expect.any(String),
      });
    });

    it("should return 400 when groupName is missing", async () => {
      mockEvent.body = JSON.stringify({
        email: "test@example.com",
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: "Bad Request",
        message: "Group name is required",
        timestamp: expect.any(String),
      });
    });
  });

  describe("Successful Operations", () => {
    beforeEach(() => {
      (jwtAuth.extractTokenFromHeader as jest.Mock).mockReturnValue(
        "valid-token"
      );
      (jwtAuth.verifyJwtToken as jest.Mock).mockResolvedValue(true);
    });

    it("should successfully add user to group", async () => {
      const mockSubscriber = {
        id: "subscriber-123",
        email: "test@example.com",
        status: "active",
      };

      const mockGroup = {
        id: "group-456",
        name: "Test Group",
      };

      mockMailerLiteService.getSubscriberByEmail.mockResolvedValue(
        mockSubscriber
      );
      mockMailerLiteService.getGroupByName.mockResolvedValue(mockGroup);
      mockMailerLiteService.addSubscriberToGroup.mockResolvedValue(undefined);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({
        success: true,
        message:
          "Successfully added user test@example.com to group 'Test Group'",
        subscriberId: "subscriber-123",
        groupId: "group-456",
      });

      expect(mockMailerLiteService.getSubscriberByEmail).toHaveBeenCalledWith(
        "test@example.com"
      );
      expect(mockMailerLiteService.getGroupByName).toHaveBeenCalledWith(
        "Test Group"
      );
      expect(mockMailerLiteService.addSubscriberToGroup).toHaveBeenCalledWith(
        "subscriber-123",
        "group-456"
      );
    });

    it("should handle subscriber already in group gracefully", async () => {
      const mockSubscriber = {
        id: "subscriber-123",
        email: "test@example.com",
        status: "active",
      };

      const mockGroup = {
        id: "group-456",
        name: "Test Group",
      };

      mockMailerLiteService.getSubscriberByEmail.mockResolvedValue(
        mockSubscriber
      );
      mockMailerLiteService.getGroupByName.mockResolvedValue(mockGroup);
      mockMailerLiteService.addSubscriberToGroup.mockRejectedValue(
        new Error("Subscriber is already in the group or invalid data provided")
      );

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({
        success: true,
        message: "User test@example.com is already in group 'Test Group'",
      });
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      (jwtAuth.extractTokenFromHeader as jest.Mock).mockReturnValue(
        "valid-token"
      );
      (jwtAuth.verifyJwtToken as jest.Mock).mockResolvedValue(true);
    });

    it("should return 404 when subscriber not found", async () => {
      mockMailerLiteService.getSubscriberByEmail.mockResolvedValue(null);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({
        error: "Not Found",
        message: "Subscriber with email test@example.com not found",
        timestamp: expect.any(String),
      });
    });

    it("should return 404 when group not found", async () => {
      const mockSubscriber = {
        id: "subscriber-123",
        email: "test@example.com",
        status: "active",
      };

      mockMailerLiteService.getSubscriberByEmail.mockResolvedValue(
        mockSubscriber
      );
      mockMailerLiteService.getGroupByName.mockResolvedValue(null);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({
        error: "Not Found",
        message: "Group with name 'Test Group' not found",
        timestamp: expect.any(String),
      });
    });

    it("should return 500 when MailerLite API key is not configured", async () => {
      delete process.env.MAILERLITE_API_KEY;

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        error: "Internal Server Error",
        message: "Service configuration error",
        timestamp: expect.any(String),
      });
    });

    it("should handle rate limiting error", async () => {
      const mockSubscriber = {
        id: "subscriber-123",
        email: "test@example.com",
        status: "active",
      };

      const mockGroup = {
        id: "group-456",
        name: "Test Group",
      };

      mockMailerLiteService.getSubscriberByEmail.mockResolvedValue(
        mockSubscriber
      );
      mockMailerLiteService.getGroupByName.mockResolvedValue(mockGroup);
      mockMailerLiteService.addSubscriberToGroup.mockRejectedValue(
        new Error("Rate limit exceeded. Please try again later")
      );

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        error: "Internal Server Error",
        message: "Service temporarily unavailable. Please try again later.",
        timestamp: expect.any(String),
      });
    });
  });
});
