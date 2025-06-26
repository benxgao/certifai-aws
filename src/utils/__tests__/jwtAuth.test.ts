import { verifyJwtToken, extractTokenFromHeader } from "../jwtAuth";
import { jwtVerify } from "jose";

// Mock the logger
jest.mock("../logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock jest.fn() for jose
const mockJwtVerify = jwtVerify as jest.MockedFunction<typeof jwtVerify>;

describe("JWT Authentication Utility", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("verifyJwtToken", () => {
    it("should return false when PUBLIC_JWT_SECRET is not set", async () => {
      delete process.env.PUBLIC_JWT_SECRET;

      const result = await verifyJwtToken("some-token");

      expect(result).toBe(false);
    });

    it("should return true for valid JWT token", async () => {
      process.env.PUBLIC_JWT_SECRET = "test-secret-key";
      mockJwtVerify.mockResolvedValue({ payload: { userId: "123" } } as any);

      const result = await verifyJwtToken("valid-token");

      expect(result).toBe(true);
      expect(mockJwtVerify).toHaveBeenCalledWith(
        "valid-token",
        expect.any(Uint8Array)
      );
    });

    it("should return false when token verification throws an error", async () => {
      process.env.PUBLIC_JWT_SECRET = "test-secret-key";
      mockJwtVerify.mockRejectedValue(new Error("Verification failed"));

      const result = await verifyJwtToken("some-token");

      expect(result).toBe(false);
    });
  });

  describe("extractTokenFromHeader", () => {
    it("should return null when authorization header is undefined", () => {
      const result = extractTokenFromHeader(undefined);
      expect(result).toBeNull();
    });

    it("should extract token from Bearer format", () => {
      const result = extractTokenFromHeader("Bearer abc123xyz");
      expect(result).toBe("abc123xyz");
    });

    it("should extract token from bearer format (case insensitive)", () => {
      const result = extractTokenFromHeader("bearer abc123xyz");
      expect(result).toBe("abc123xyz");
    });

    it("should return entire header value if no Bearer prefix", () => {
      const result = extractTokenFromHeader("abc123xyz");
      expect(result).toBe("abc123xyz");
    });

    it("should handle Bearer token with spaces", () => {
      const result = extractTokenFromHeader("Bearer   abc123xyz");
      expect(result).toBe("abc123xyz");
    });

    it("should return empty string for empty Bearer token", () => {
      const result = extractTokenFromHeader("Bearer ");
      expect(result).toBe("");
    });
  });
});
