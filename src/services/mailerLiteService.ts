import axios, { AxiosResponse } from "axios";
import { UserRegistrationRequest } from "../types";
import { logger } from "../utils/logger";

interface MailerLiteSubscriber {
  email: string;
  fields?: Record<string, string | number>;
  groups?: string[];
}

interface MailerLiteResponse {
  data: {
    id: string;
    email: string;
    status: string;
  };
}

export class MailerLiteService {
  private readonly apiKey: string;
  private readonly baseUrl = "https://connect.mailerlite.com/api";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("MailerLite API key is required");
    }
    this.apiKey = apiKey;
  }

  async createSubscriber(userData: UserRegistrationRequest): Promise<string> {
    try {
      logger.info("Creating MailerLite subscriber", { email: userData.email });

      const subscriberData: MailerLiteSubscriber = {
        email: userData.email,
        fields: {
          ...userData.fields,
          ...(userData.firstName && { first_name: userData.firstName }),
          ...(userData.lastName && { last_name: userData.lastName }),
        },
        groups: userData.groups,
      };

      const response: AxiosResponse<MailerLiteResponse> = await axios.post(
        `${this.baseUrl}/subscribers`,
        subscriberData,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );

      logger.info("Successfully created MailerLite subscriber", {
        subscriberId: response.data.data.id,
        email: userData.email,
      });

      return response.data.data.id;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;

        logger.error("MailerLite API error", error, {
          email: userData.email,
          statusCode,
          errorMessage,
        });

        // Handle specific MailerLite errors
        if (statusCode === 422) {
          throw new Error("Invalid data provided or subscriber already exists");
        } else if (statusCode === 401) {
          throw new Error("Invalid MailerLite API key");
        } else if (statusCode === 429) {
          throw new Error("Rate limit exceeded. Please try again later");
        }

        throw new Error(`MailerLite API error: ${errorMessage}`);
      }

      logger.error("Unexpected error creating MailerLite subscriber", error, {
        email: userData.email,
      });

      throw new Error("Failed to create subscriber due to unexpected error");
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/me`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
        timeout: 5000,
      });
      return true;
    } catch (error) {
      logger.error("MailerLite API key validation failed", error);
      return false;
    }
  }
}
