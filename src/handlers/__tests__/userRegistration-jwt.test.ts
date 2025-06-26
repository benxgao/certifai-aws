import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../userRegistration";
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

describe("UserRegistration Handler with JWT Protection", () => {
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
    process.env.PUBLIC_JWT_SECRET = "test-jwt-secret";
  });

  afterEach(() => {
    delete process.env.MAILERLITE_API_KEY;
    delete process.env.PUBLIC_JWT_SECRET;
  });

  describe("JWT Authentication", () => {
    it("should return 401 when no authorization header is provided", async () => {
      const mockExtractToken = jest.spyOn(jwtAuth, "extractTokenFromHeader");
      mockExtractToken.mockReturnValue(null);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toEqual({
        error: "Unauthorized",
        message: "Authentication token is required",
        timestamp: expect.any(String),
      });
    });

    it("should return 401 when token is invalid", async () => {
      mockEvent.headers.Authorization = "Bearer invalid-token";

      const mockExtractToken = jest.spyOn(jwtAuth, "extractTokenFromHeader");
      const mockVerifyToken = jest.spyOn(jwtAuth, "verifyJwtToken");

      mockExtractToken.mockReturnValue("invalid-token");
      mockVerifyToken.mockResolvedValue(false);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toEqual({
        error: "Unauthorized",
        message: "Invalid authentication token",
        timestamp: expect.any(String),
      });
    });

    it("should proceed with registration when valid token is provided", async () => {
      mockEvent.headers.Authorization = "Bearer valid-token";

      const mockExtractToken = jest.spyOn(jwtAuth, "extractTokenFromHeader");
      const mockVerifyToken = jest.spyOn(jwtAuth, "verifyJwtToken");
      const mockMailerLiteService = jest.mocked(
        mailerLiteService.MailerLiteService
      );

      mockExtractToken.mockReturnValue("valid-token");
      mockVerifyToken.mockResolvedValue(true);

      // Mock MailerLite service
      const mockCreateSubscriber = jest
        .fn()
        .mockResolvedValue("subscriber-123");
      mockMailerLiteService.mockImplementation(
        () =>
          ({
            createSubscriber: mockCreateSubscriber,
          } as any)
      );

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockVerifyToken).toHaveBeenCalledWith("valid-token");
      expect(mockCreateSubscriber).toHaveBeenCalledWith({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      });
    });

    it("should extract token from lowercase authorization header", async () => {
      mockEvent.headers.authorization = "Bearer valid-token";

      const mockExtractToken = jest.spyOn(jwtAuth, "extractTokenFromHeader");
      const mockVerifyToken = jest.spyOn(jwtAuth, "verifyJwtToken");

      mockExtractToken.mockReturnValue("valid-token");
      mockVerifyToken.mockResolvedValue(true);

      const mockMailerLiteService = jest.mocked(
        mailerLiteService.MailerLiteService
      );
      const mockCreateSubscriber = jest
        .fn()
        .mockResolvedValue("subscriber-123");
      mockMailerLiteService.mockImplementation(
        () =>
          ({
            createSubscriber: mockCreateSubscriber,
          } as any)
      );

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockExtractToken).toHaveBeenCalledWith("Bearer valid-token");
    });
  });

  describe("Request Validation after JWT", () => {
    beforeEach(() => {
      // Setup valid JWT for all validation tests
      mockEvent.headers.Authorization = "Bearer valid-token";

      const mockExtractToken = jest.spyOn(jwtAuth, "extractTokenFromHeader");
      const mockVerifyToken = jest.spyOn(jwtAuth, "verifyJwtToken");

      mockExtractToken.mockReturnValue("valid-token");
      mockVerifyToken.mockResolvedValue(true);
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
      mockEvent.body = "invalid-json";

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: "Bad Request",
        message: "Invalid JSON format",
        timestamp: expect.any(String),
      });
    });
  });
});
