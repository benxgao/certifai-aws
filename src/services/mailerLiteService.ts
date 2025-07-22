import axios, { AxiosResponse } from "axios";
import { UserSubscriptionRequest } from "../types/index.js";
import { logger } from "../utils/logger.js";

interface MailerLiteSubscriber {
  email: string;
  fields?: Record<string, string | number>;
  groups?: string[];
  subscribed_at?: string;
  ip_address?: string;
  status?: string;
}

interface MailerLiteResponse {
  data: {
    id: string;
    email: string;
    status: string;
  };
}

interface MailerLiteGroup {
  id: string;
  name: string;
}

interface MailerLiteGroupsResponse {
  data: MailerLiteGroup[];
}

interface MailerLiteSubscriberData {
  id: string;
  email: string;
  status: string;
  subscribed_at?: string;
  fields?: Record<string, string | number>;
}

interface MailerLiteSubscribersResponse {
  data: MailerLiteSubscriberData[];
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

  async createSubscriber(userData: UserSubscriptionRequest): Promise<string> {
    try {
      logger.info("Creating MailerLite subscriber", { email: userData.email });

      // Convert group names to IDs if groups are provided
      let groupIds: string[] | undefined;
      if (userData.groups && userData.groups.length > 0) {
        // Check if groups contain names (non-numeric strings) that need conversion
        const hasGroupNames = userData.groups.some(
          (group) =>
            typeof group === "string" &&
            isNaN(Number(group)) &&
            group.trim() !== ""
        );

        if (hasGroupNames) {
          logger.info("Converting group names to IDs", {
            groups: userData.groups,
          });
          // Convert the entire array - the conversion function will handle mixed scenarios
          groupIds = await this.convertGroupNamesToIds(userData.groups);
        } else {
          // Groups are already IDs
          groupIds = userData.groups;
        }
      }

      const subscriberData: MailerLiteSubscriber = {
        email: userData.email,
        fields: {
          ...userData.fields,
          ...(userData.firstName && { first_name: userData.firstName }),
          ...(userData.lastName && { last_name: userData.lastName }),
        },
        groups: groupIds,
        ...(userData.subscribed_at && {
          subscribed_at: userData.subscribed_at,
        }),
        ...(userData.ip_address && { ip_address: userData.ip_address }),
        ...(userData.status && { status: userData.status }),
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

  async updateSubscriber(
    subscriberId: string,
    updateData: { status: string; unsubscribed_at: string }
  ): Promise<void> {
    try {
      logger.info("Updating MailerLite subscriber", {
        subscriberId,
        status: updateData.status,
        unsubscribed_at: updateData.unsubscribed_at,
      });

      await axios.put(
        `${this.baseUrl}/subscribers/${subscriberId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );

      logger.info("Successfully updated MailerLite subscriber", {
        subscriberId,
        status: updateData.status,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;

        logger.error("MailerLite API error during update", error, {
          subscriberId,
          statusCode,
          errorMessage,
        });

        // Handle specific MailerLite errors
        if (statusCode === 404) {
          throw new Error("Subscriber not found");
        } else if (statusCode === 401) {
          throw new Error("Invalid MailerLite API key");
        } else if (statusCode === 429) {
          throw new Error("Rate limit exceeded. Please try again later");
        }

        throw new Error(`MailerLite API error: ${errorMessage}`);
      }

      logger.error("Unexpected error updating MailerLite subscriber", error, {
        subscriberId,
      });

      throw new Error("Failed to update subscriber due to unexpected error");
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

  async getGroups(): Promise<MailerLiteGroup[]> {
    try {
      logger.info("Fetching MailerLite groups");

      const response: AxiosResponse<MailerLiteGroupsResponse> = await axios.get(
        `${this.baseUrl}/groups`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );

      logger.info("Successfully fetched MailerLite groups", {
        groupCount: response.data.data.length,
      });

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;

        logger.error("MailerLite API error fetching groups", error, {
          statusCode,
          errorMessage,
        });

        if (statusCode === 401) {
          throw new Error("Invalid MailerLite API key");
        } else if (statusCode === 429) {
          throw new Error("Rate limit exceeded. Please try again later");
        }

        throw new Error(`MailerLite API error: ${errorMessage}`);
      }

      logger.error("Unexpected error fetching MailerLite groups", error);
      throw new Error("Failed to fetch groups due to unexpected error");
    }
  }

  async convertGroupNamesToIds(groupNames: string[]): Promise<string[]> {
    try {
      if (!groupNames || groupNames.length === 0) {
        return [];
      }

      // Fetch all groups from MailerLite
      const groups = await this.getGroups();

      // Create a map of group names to IDs (case-insensitive)
      const nameToIdMap = new Map<string, string>();
      groups.forEach((group) => {
        nameToIdMap.set(group.name.toLowerCase(), group.id);
      });

      // Convert group names to IDs
      const groupIds: string[] = [];
      const notFoundGroups: string[] = [];

      for (const group of groupNames) {
        // Check if it's already a numeric ID
        if (!isNaN(Number(group)) && group.trim() !== "") {
          groupIds.push(group);
        } else {
          // Try to convert name to ID
          const groupId = nameToIdMap.get(group.toLowerCase());
          if (groupId) {
            groupIds.push(groupId);
          } else {
            notFoundGroups.push(group);
          }
        }
      }

      if (notFoundGroups.length > 0) {
        logger.warn("Some groups not found", {
          notFoundGroups,
          availableGroups: groups.map((g) => g.name),
        });
        throw new Error(`Groups not found: ${notFoundGroups.join(", ")}`);
      }

      logger.info("Successfully converted group names to IDs", {
        originalGroups: groupNames,
        convertedIds: groupIds,
      });

      return groupIds;
    } catch (error) {
      logger.error("Error converting group names to IDs", error);
      throw error;
    }
  }

  async getSubscriberByEmail(
    email: string
  ): Promise<MailerLiteSubscriberData | null> {
    try {
      logger.info("Fetching MailerLite subscriber by email", { email });

      const response: AxiosResponse<MailerLiteSubscribersResponse> =
        await axios.get(`${this.baseUrl}/subscribers`, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
          },
          params: {
            filter: {
              email: email,
            },
          },
          timeout: 10000,
        });

      const subscribers = response.data.data;
      if (subscribers.length === 0) {
        logger.info("No subscriber found with email", { email });
        return null;
      }

      logger.info("Successfully found subscriber by email", {
        email,
        subscriberId: subscribers[0].id,
      });

      return subscribers[0];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;

        logger.error(
          "MailerLite API error fetching subscriber by email",
          error,
          {
            email,
            statusCode,
            errorMessage,
          }
        );

        if (statusCode === 401) {
          throw new Error("Invalid MailerLite API key");
        } else if (statusCode === 429) {
          throw new Error("Rate limit exceeded. Please try again later");
        }

        throw new Error(`MailerLite API error: ${errorMessage}`);
      }

      logger.error("Unexpected error fetching subscriber by email", error, {
        email,
      });
      throw new Error("Failed to fetch subscriber due to unexpected error");
    }
  }

  async addSubscriberToGroup(
    subscriberId: string,
    groupId: string
  ): Promise<void> {
    try {
      logger.info("Adding subscriber to group", { subscriberId, groupId });

      await axios.post(
        `${this.baseUrl}/subscribers/${subscriberId}/groups/${groupId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );

      logger.info("Successfully added subscriber to group", {
        subscriberId,
        groupId,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;

        logger.error("MailerLite API error adding subscriber to group", error, {
          subscriberId,
          groupId,
          statusCode,
          errorMessage,
        });

        if (statusCode === 404) {
          throw new Error("Subscriber or group not found");
        } else if (statusCode === 401) {
          throw new Error("Invalid MailerLite API key");
        } else if (statusCode === 429) {
          throw new Error("Rate limit exceeded. Please try again later");
        } else if (statusCode === 422) {
          throw new Error(
            "Subscriber is already in the group or invalid data provided"
          );
        }

        throw new Error(`MailerLite API error: ${errorMessage}`);
      }

      logger.error("Unexpected error adding subscriber to group", error, {
        subscriberId,
        groupId,
      });

      throw new Error(
        "Failed to add subscriber to group due to unexpected error"
      );
    }
  }

  async getGroupByName(groupName: string): Promise<MailerLiteGroup | null> {
    try {
      logger.info("Fetching group by name", { groupName });

      const groups = await this.getGroups();
      const group = groups.find(
        (g) => g.name.toLowerCase() === groupName.toLowerCase()
      );

      if (!group) {
        logger.info("No group found with name", { groupName });
        return null;
      }

      logger.info("Successfully found group by name", {
        groupName,
        groupId: group.id,
      });

      return group;
    } catch (error) {
      logger.error("Error fetching group by name", error, { groupName });
      throw error;
    }
  }
}
