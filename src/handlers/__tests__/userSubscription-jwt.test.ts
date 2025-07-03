import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../userSubscription";
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

describe("UserSubscription Handler with JWT Protection", () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup basic event structure
    mockEvent = {
      headers: {},
      body: JSON.stringify({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
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
  });

  afterEach(() => {
    delete process.env.MAILERLITE_API_KEY;
    delete process.env.MARKETING_API_JWT_SECRET;
  });

  describe("JWT Authentication", () => {
    it("should return 401 when no Authorization header is provided", async () => {
      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toEqual({
        message: "Authentication token is required",
      });
    });

    it("should return 401 when JWT token is invalid", async () => {
      mockEvent.headers.Authorization = "Bearer invalid-token";

      // Mock token extraction and verification
      jest
        .spyOn(jwtAuth, "extractTokenFromHeader")
        .mockReturnValue("invalid-token");
      jest.spyOn(jwtAuth, "verifyJwtToken").mockResolvedValue(false);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toEqual({
        message: "Invalid authentication token",
      });
    });

    it("should proceed when valid JWT token is provided", async () => {
      mockEvent.headers.Authorization = "Bearer valid-token";

      // Mock successful JWT verification
      jest
        .spyOn(jwtAuth, "extractTokenFromHeader")
        .mockReturnValue("valid-token");
      jest.spyOn(jwtAuth, "verifyJwtToken").mockResolvedValue(true);

      // Mock successful MailerLite service
      const mockCreateSubscriber = jest
        .fn()
        .mockResolvedValue("subscriber-123");
      (
        mailerLiteService.MailerLiteService as jest.MockedClass<
          typeof mailerLiteService.MailerLiteService
        >
      ).mockImplementation(
        () =>
          ({
            createSubscriber: mockCreateSubscriber,
          } as any)
      );

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCreateSubscriber).toHaveBeenCalled();
    });
  });

  describe("Request Validation", () => {
    beforeEach(() => {
      // Setup valid JWT for these tests
      mockEvent.headers.Authorization = "Bearer valid-token";
      jest
        .spyOn(jwtAuth, "extractTokenFromHeader")
        .mockReturnValue("valid-token");
      jest.spyOn(jwtAuth, "verifyJwtToken").mockResolvedValue(true);
    });

    it("should return 400 when request body is empty", async () => {
      mockEvent.body = null;

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        message: "Request body is required",
      });
    });

    it("should return 400 when request body is invalid JSON", async () => {
      mockEvent.body = "invalid-json";

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        message: "Invalid JSON format",
      });
    });

    it("should return 400 when email is missing", async () => {
      mockEvent.body = JSON.stringify({
        firstName: "John",
        lastName: "Doe",
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain("Email is required");
    });

    it("should return 400 when email is invalid", async () => {
      mockEvent.body = JSON.stringify({
        email: "invalid-email",
        firstName: "John",
        lastName: "Doe",
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain("valid email address");
    });
  });

  describe("MailerLite Integration", () => {
    beforeEach(() => {
      // Setup valid JWT for these tests
      mockEvent.headers.Authorization = "Bearer valid-token";
      jest
        .spyOn(jwtAuth, "extractTokenFromHeader")
        .mockReturnValue("valid-token");
      jest.spyOn(jwtAuth, "verifyJwtToken").mockResolvedValue(true);
    });

    it("should return 500 when MailerLite API key is not configured", async () => {
      delete process.env.MAILERLITE_API_KEY;

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        message: "Service configuration error",
      });
    });

    it("should successfully create subscriber when everything is valid", async () => {
      const mockCreateSubscriber = jest
        .fn()
        .mockResolvedValue("subscriber-123");
      (
        mailerLiteService.MailerLiteService as jest.MockedClass<
          typeof mailerLiteService.MailerLiteService
        >
      ).mockImplementation(
        () =>
          ({
            createSubscriber: mockCreateSubscriber,
          } as any)
      );

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual({
        success: true,
        message: "User subscribed successfully",
        subscriberId: "subscriber-123",
      });
      expect(mockCreateSubscriber).toHaveBeenCalledWith({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        ip_address: "127.0.0.1", // Should be added from request context
      });
    });

    it("should handle MailerLite service errors", async () => {
      const mockCreateSubscriber = jest
        .fn()
        .mockRejectedValue(new Error("MailerLite API error"));
      (
        mailerLiteService.MailerLiteService as jest.MockedClass<
          typeof mailerLiteService.MailerLiteService
        >
      ).mockImplementation(
        () =>
          ({
            createSubscriber: mockCreateSubscriber,
          } as any)
      );

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        message: "MailerLite API error",
      });
    });
  });

  describe("IP Address Handling", () => {
    beforeEach(() => {
      // Setup valid JWT for these tests
      mockEvent.headers.Authorization = "Bearer valid-token";
      jest
        .spyOn(jwtAuth, "extractTokenFromHeader")
        .mockReturnValue("valid-token");
      jest.spyOn(jwtAuth, "verifyJwtToken").mockResolvedValue(true);
    });

    it("should use IP address from request body when provided", async () => {
      mockEvent.body = JSON.stringify({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        ip_address: "192.168.1.1",
      });

      const mockCreateSubscriber = jest
        .fn()
        .mockResolvedValue("subscriber-123");
      (
        mailerLiteService.MailerLiteService as jest.MockedClass<
          typeof mailerLiteService.MailerLiteService
        >
      ).mockImplementation(
        () =>
          ({
            createSubscriber: mockCreateSubscriber,
          } as any)
      );

      await handler(mockEvent, mockContext);

      expect(mockCreateSubscriber).toHaveBeenCalledWith({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        ip_address: "192.168.1.1", // Should use the provided IP
      });
    });

    it("should auto-fill IP address from request context when not provided", async () => {
      const mockCreateSubscriber = jest
        .fn()
        .mockResolvedValue("subscriber-123");
      (
        mailerLiteService.MailerLiteService as jest.MockedClass<
          typeof mailerLiteService.MailerLiteService
        >
      ).mockImplementation(
        () =>
          ({
            createSubscriber: mockCreateSubscriber,
          } as any)
      );

      await handler(mockEvent, mockContext);

      expect(mockCreateSubscriber).toHaveBeenCalledWith({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        ip_address: "127.0.0.1", // Should be added from request context
      });
    });
  });
});
