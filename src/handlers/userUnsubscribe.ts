import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { UserUnsubscribeResponse } from "../types/index.js";
import {
  createSuccessResponse,
  createBadRequestResponse,
  createInternalServerErrorResponse,
  createNotFoundResponse,
  createUnauthorizedResponse,
} from "../utils/response.js";
import { MailerLiteService } from "../services/mailerLiteService.js";
import { logger } from "../utils/logger.js";
import { verifyJwtToken, extractTokenFromHeader } from "../utils/jwtAuth.js";
import { format } from "date-fns";

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info("User unsubscribe endpoint called", {
      requestId: context.awsRequestId,
      sourceIp: event.requestContext.identity.sourceIp,
    });

    // JWT Authentication - Extract and verify token
    const authHeader =
      event.headers.Authorization || event.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      logger.warn("No JWT token provided in Authorization header");
      return createUnauthorizedResponse("Authentication token is required");
    }

    const isTokenValid = await verifyJwtToken(token);
    if (!isTokenValid) {
      logger.warn("Invalid JWT token provided", {
        requestId: context.awsRequestId,
        sourceIp: event.requestContext.identity.sourceIp,
      });
      return createUnauthorizedResponse("Invalid authentication token");
    }

    logger.info("JWT authentication successful", {
      requestId: context.awsRequestId,
    });

    // Extract subscriber ID from path parameters
    const subscriberId = event.pathParameters?.id;
    if (!subscriberId) {
      logger.warn("Subscriber ID not provided in path parameters");
      return createBadRequestResponse("Subscriber ID is required");
    }

    // Validate subscriber ID format (basic validation)
    if (subscriberId.trim().length === 0) {
      logger.warn("Empty subscriber ID provided");
      return createBadRequestResponse("Invalid subscriber ID");
    }

    // Check for MailerLite API key
    const mailerLiteApiKey = process.env.MAILERLITE_API_KEY;
    if (!mailerLiteApiKey) {
      logger.error("MailerLite API key not configured");
      return createInternalServerErrorResponse("Service configuration error");
    }

    // Create MailerLite service instance
    const mailerLiteService = new MailerLiteService(mailerLiteApiKey);

    try {
      // Prepare update data for unsubscribe
      const updateData = {
        status: "unsubscribed",
        unsubscribed_at: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      };

      // Update subscriber status in MailerLite
      await mailerLiteService.updateSubscriber(subscriberId, updateData);

      const response: UserUnsubscribeResponse = {
        success: true,
        message: "User unsubscribed successfully",
        subscriberId,
      };

      logger.info("User unsubscribe completed successfully", {
        subscriberId,
        requestId: context.awsRequestId,
        unsubscribed_at: updateData.unsubscribed_at,
      });

      return createSuccessResponse(response);
    } catch (mailerLiteError) {
      const errorMessage =
        mailerLiteError instanceof Error
          ? mailerLiteError.message
          : "Failed to unsubscribe user with MailerLite";

      logger.error("MailerLite unsubscribe failed", mailerLiteError, {
        subscriberId,
        requestId: context.awsRequestId,
      });

      // Handle specific error cases
      if (errorMessage.includes("Subscriber not found")) {
        return createNotFoundResponse("Subscriber not found");
      }

      // Return a user-friendly error response
      const response: UserUnsubscribeResponse = {
        success: false,
        message: errorMessage,
      };

      return createBadRequestResponse(response.message);
    }
  } catch (error) {
    logger.error("Unexpected error in user unsubscribe", error, {
      requestId: context.awsRequestId,
    });

    return createInternalServerErrorResponse("An unexpected error occurred");
  }
};
