import axios from "axios";
import { MailerLiteService } from "../mailerLiteService.js";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger
jest.mock("../../utils/logger.js");

describe("MailerLiteService", () => {
  let service: MailerLiteService;
  const mockApiKey = "test-api-key";

  beforeEach(() => {
    service = new MailerLiteService(mockApiKey);
    jest.clearAllMocks();
  });

  describe("getGroups", () => {
    it("should fetch groups successfully", async () => {
      const mockGroupsResponse = {
        data: {
          data: [
            { id: "123", name: "Newsletter" },
            { id: "456", name: "VIP Members" },
            { id: "789", name: "Weekly Updates" },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockGroupsResponse);

      const result = await service.getGroups();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://connect.mailerlite.com/api/groups",
        {
          headers: {
            Authorization: `Bearer ${mockApiKey}`,
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );

      expect(result).toEqual([
        { id: "123", name: "Newsletter" },
        { id: "456", name: "VIP Members" },
        { id: "789", name: "Weekly Updates" },
      ]);
    });

    it("should handle API errors", async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: "Unauthorized" },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(service.getGroups()).rejects.toThrow(
        "Invalid MailerLite API key"
      );
    });
  });

  describe("convertGroupNamesToIds", () => {
    beforeEach(() => {
      const mockGroupsResponse = {
        data: {
          data: [
            { id: "123", name: "Newsletter" },
            { id: "456", name: "VIP Members" },
            { id: "789", name: "Weekly Updates" },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockGroupsResponse);
    });

    it("should convert group names to IDs successfully", async () => {
      const groupNames = ["Newsletter", "VIP Members"];

      const result = await service.convertGroupNamesToIds(groupNames);

      expect(result).toEqual(["123", "456"]);
    });

    it("should handle case-insensitive group names", async () => {
      const groupNames = ["newsletter", "vip members", "WEEKLY UPDATES"];

      const result = await service.convertGroupNamesToIds(groupNames);

      expect(result).toEqual(["123", "456", "789"]);
    });

    it("should throw error for non-existent group names", async () => {
      const groupNames = ["Newsletter", "Non-existent Group"];

      await expect(service.convertGroupNamesToIds(groupNames)).rejects.toThrow(
        "Groups not found: Non-existent Group"
      );
    });

    it("should return empty array for empty input", async () => {
      const result = await service.convertGroupNamesToIds([]);

      expect(result).toEqual([]);
    });
  });

  describe("createSubscriber with group conversion", () => {
    beforeEach(() => {
      const mockGroupsResponse = {
        data: {
          data: [
            { id: "123", name: "Newsletter" },
            { id: "456", name: "VIP Members" },
          ],
        },
      };

      const mockSubscriberResponse = {
        data: {
          data: {
            id: "subscriber-123",
            email: "test@example.com",
            status: "active",
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockGroupsResponse);
      mockedAxios.post.mockResolvedValue(mockSubscriberResponse);
    });

    it("should convert group names to IDs when creating subscriber", async () => {
      const userData = {
        email: "test@example.com",
        groups: ["Newsletter", "VIP Members"],
      };

      const result = await service.createSubscriber(userData);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://connect.mailerlite.com/api/groups",
        expect.any(Object)
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://connect.mailerlite.com/api/subscribers",
        expect.objectContaining({
          email: "test@example.com",
          groups: ["123", "456"],
        }),
        expect.any(Object)
      );

      expect(result).toBe("subscriber-123");
    });

    it("should not convert group IDs (numeric strings)", async () => {
      const userData = {
        email: "test@example.com",
        groups: ["123", "456"],
      };

      const result = await service.createSubscriber(userData);

      // Should not call getGroups since groups are already IDs
      expect(mockedAxios.get).not.toHaveBeenCalled();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://connect.mailerlite.com/api/subscribers",
        expect.objectContaining({
          email: "test@example.com",
          groups: ["123", "456"],
        }),
        expect.any(Object)
      );

      expect(result).toBe("subscriber-123");
    });

    it("should handle mixed group names and IDs", async () => {
      const userData = {
        email: "test@example.com",
        groups: ["Newsletter", "456"], // Mix of name and ID
      };

      const result = await service.createSubscriber(userData);

      // Should call getGroups to convert names
      expect(mockedAxios.get).toHaveBeenCalled();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://connect.mailerlite.com/api/subscribers",
        expect.objectContaining({
          email: "test@example.com",
          groups: ["123", "456"], // Both converted to IDs
        }),
        expect.any(Object)
      );

      expect(result).toBe("subscriber-123");
    });
  });

  describe("updateSubscriberFields", () => {
    it("should update subscriber fields successfully", async () => {
      const subscriberId = "subscriber-123";
      const fields = {
        interests:
          '{"certificationInterests":"AWS, Azure","additionalInterests":"Security"}',
        source: "adaptive-learning-interest",
      };

      mockedAxios.put.mockResolvedValueOnce({ data: {} });

      await service.updateSubscriberFields(subscriberId, fields);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        `https://connect.mailerlite.com/api/subscribers/${subscriberId}`,
        { fields },
        {
          headers: {
            Authorization: `Bearer ${mockApiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );
    });

    it("should handle 404 error when subscriber not found", async () => {
      const subscriberId = "non-existent-subscriber";
      const fields = { interests: "test" };

      mockedAxios.put.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: "Subscriber not found" },
        },
      });
      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        service.updateSubscriberFields(subscriberId, fields)
      ).rejects.toThrow("Subscriber not found");
    });

    it("should handle 401 error for invalid API key", async () => {
      const subscriberId = "subscriber-123";
      const fields = { interests: "test" };

      mockedAxios.put.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: "Unauthorized" },
        },
      });
      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        service.updateSubscriberFields(subscriberId, fields)
      ).rejects.toThrow("Invalid MailerLite API key");
    });

    it("should handle rate limiting error", async () => {
      const subscriberId = "subscriber-123";
      const fields = { interests: "test" };

      mockedAxios.put.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 429,
          data: { message: "Rate limit exceeded" },
        },
      });
      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        service.updateSubscriberFields(subscriberId, fields)
      ).rejects.toThrow("Rate limit exceeded. Please try again later");
    });
  });
});
