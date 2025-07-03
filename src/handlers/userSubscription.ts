import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import {
  UserSubscriptionRequest,
  UserSubscriptionResponse,
} from "../types/index.js";
import {
  createSuccessResponse,
  createBadRequestResponse,
  createInternalServerErrorResponse,
} from "../utils/response.js";
import { validateUserSubscription } from "../utils/validation.js";
import { MailerLiteService } from "../services/mailerLiteService.js";
import { logger } from "../utils/logger.js";
import { verifyJwtToken, extractTokenFromHeader } from "../utils/jwtAuth.js";
import { createUnauthorizedResponse } from "../utils/response.js";
import { format } from "date-fns";

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info("User subscription endpoint called", {
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

    // Parse request body
    if (!event.body) {
      logger.warn("Empty request body received");
      return createBadRequestResponse("Request body is required");
    }

    let userData: unknown;
    try {
      userData = JSON.parse(event.body);
    } catch (parseError) {
      logger.error("Invalid JSON in request body", parseError);
      return createBadRequestResponse("Invalid JSON format");
    }

    // Validate request data
    const validation = validateUserSubscription(userData);
    if (!validation.isValid) {
      logger.warn("Validation failed", { error: validation.error, userData });
      return createBadRequestResponse(
        validation.error || "Invalid request data"
      );
    }

    const validatedData = validation.value as UserSubscriptionRequest;

    // Add IP address from request context if not provided in body
    if (!validatedData.ip_address && event.requestContext.identity.sourceIp) {
      validatedData.ip_address = event.requestContext.identity.sourceIp;
    }

    // Set default values for subscribed_at and status if not provided
    if (!validatedData.subscribed_at) {
      validatedData.subscribed_at = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    }

    if (!validatedData.status) {
      validatedData.status = "active";
    }

    // Check for MailerLite API key
    const mailerLiteApiKey = process.env.MAILERLITE_API_KEY;
    if (!mailerLiteApiKey) {
      logger.error("MailerLite API key not configured");
      return createInternalServerErrorResponse("Service configuration error");
    }

    // Create MailerLite subscriber
    const mailerLiteService = new MailerLiteService(mailerLiteApiKey);

    try {
      const subscriberId = await mailerLiteService.createSubscriber(
        validatedData
      );

      const response: UserSubscriptionResponse = {
        success: true,
        message: "User subscribed successfully",
        subscriberId,
      };

      logger.info("User subscription completed successfully", {
        email: validatedData.email,
        subscriberId,
        requestId: context.awsRequestId,
        status: validatedData.status,
        subscribed_at: validatedData.subscribed_at,
        ip_address: validatedData.ip_address,
      });

      return createSuccessResponse(response);
    } catch (mailerLiteError) {
      const errorMessage =
        mailerLiteError instanceof Error
          ? mailerLiteError.message
          : "Failed to subscribe user with MailerLite";

      logger.error("MailerLite subscription failed", mailerLiteError, {
        email: validatedData.email,
        requestId: context.awsRequestId,
      });

      // Return a user-friendly error response
      const response: UserSubscriptionResponse = {
        success: false,
        message: errorMessage,
      };

      return createBadRequestResponse(response.message);
    }
  } catch (error) {
    logger.error("Unexpected error in user subscription", error, {
      requestId: context.awsRequestId,
    });

    return createInternalServerErrorResponse("An unexpected error occurred");
  }
};
