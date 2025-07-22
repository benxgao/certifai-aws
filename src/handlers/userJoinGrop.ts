import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { UserJoinGroupRequest, UserJoinGroupResponse } from "../types/index.js";
import {
  createSuccessResponse,
  createBadRequestResponse,
  createInternalServerErrorResponse,
  createUnauthorizedResponse,
  createNotFoundResponse,
} from "../utils/response.js";
import { validateUserJoinGroup } from "../utils/validation.js";
import { MailerLiteService } from "../services/mailerLiteService.js";
import { logger } from "../utils/logger.js";
import { verifyJwtToken, extractTokenFromHeader } from "../utils/jwtAuth.js";

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info("User join group endpoint called", {
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

    let requestData: unknown;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      logger.error("Invalid JSON in request body", parseError);
      return createBadRequestResponse("Invalid JSON format");
    }

    // Validate request data
    const validation = validateUserJoinGroup(requestData);
    if (!validation.isValid) {
      logger.warn("Validation failed", {
        error: validation.error,
        requestData,
      });
      return createBadRequestResponse(
        validation.error || "Invalid request data"
      );
    }

    const validatedData = validation.value as UserJoinGroupRequest;

    // Check for MailerLite API key
    const mailerLiteApiKey = process.env.MAILERLITE_API_KEY;
    if (!mailerLiteApiKey) {
      logger.error("MailerLite API key not configured");
      return createInternalServerErrorResponse("Service configuration error");
    }

    // Initialize MailerLite service
    const mailerLiteService = new MailerLiteService(mailerLiteApiKey);

    try {
      logger.info("Processing user join group request", {
        email: validatedData.email,
        groupName: validatedData.groupName,
        requestId: context.awsRequestId,
      });

      // Step 1: Get subscriber by email
      const subscriber = await mailerLiteService.getSubscriberByEmail(
        validatedData.email
      );

      if (!subscriber) {
        logger.warn("Subscriber not found", {
          email: validatedData.email,
          requestId: context.awsRequestId,
        });
        return createNotFoundResponse(
          `Subscriber with email ${validatedData.email} not found`
        );
      }

      // Step 2: Get group by name
      const group = await mailerLiteService.getGroupByName(
        validatedData.groupName
      );

      if (!group) {
        logger.warn("Group not found", {
          groupName: validatedData.groupName,
          requestId: context.awsRequestId,
        });
        return createNotFoundResponse(
          `Group with name '${validatedData.groupName}' not found`
        );
      }

      // Step 3: Add subscriber to group
      await mailerLiteService.addSubscriberToGroup(subscriber.id, group.id);

      // Step 4: Update interests field if metadata is provided
      if (
        validatedData.metadata &&
        (validatedData.metadata.certificationInterests ||
          validatedData.metadata.additionalInterests)
      ) {
        try {
          logger.info("Updating subscriber interests field", {
            subscriberId: subscriber.id,
            hasMetadata: !!validatedData.metadata,
            requestId: context.awsRequestId,
          });

          const interestsData = JSON.stringify(validatedData.metadata);
          await mailerLiteService.updateSubscriberFields(subscriber.id, {
            interests: interestsData,
          });

          logger.info("Successfully updated subscriber interests", {
            subscriberId: subscriber.id,
            requestId: context.awsRequestId,
          });
        } catch (interestsError) {
          // Log the error but don't fail the entire operation
          logger.error(
            "Failed to update subscriber interests field",
            interestsError,
            {
              subscriberId: subscriber.id,
              requestId: context.awsRequestId,
            }
          );
        }
      }

      const response: UserJoinGroupResponse = {
        success: true,
        message: `Successfully added user ${validatedData.email} to group '${validatedData.groupName}'`,
        subscriberId: subscriber.id,
        groupId: group.id,
      };

      logger.info("Successfully processed user join group request", {
        email: validatedData.email,
        groupName: validatedData.groupName,
        subscriberId: subscriber.id,
        groupId: group.id,
        requestId: context.awsRequestId,
      });

      return createSuccessResponse(response);
    } catch (mailerLiteError) {
      const errorMessage =
        mailerLiteError instanceof Error
          ? mailerLiteError.message
          : "Unknown MailerLite error";

      logger.error(
        "MailerLite service error during join group operation",
        mailerLiteError,
        {
          email: validatedData.email,
          groupName: validatedData.groupName,
          requestId: context.awsRequestId,
        }
      );

      // Handle specific MailerLite errors
      if (errorMessage.includes("not found")) {
        return createNotFoundResponse(errorMessage);
      } else if (errorMessage.includes("already in the group")) {
        const response: UserJoinGroupResponse = {
          success: true,
          message: `User ${validatedData.email} is already in group '${validatedData.groupName}'`,
        };
        return createSuccessResponse(response);
      } else if (errorMessage.includes("Rate limit exceeded")) {
        return createInternalServerErrorResponse(
          "Service temporarily unavailable. Please try again later."
        );
      } else if (errorMessage.includes("Invalid MailerLite API key")) {
        return createInternalServerErrorResponse("Service configuration error");
      }

      return createInternalServerErrorResponse(
        "Failed to add user to group. Please try again later."
      );
    }
  } catch (error) {
    logger.error("Unexpected error in user join group handler", error, {
      requestId: context.awsRequestId,
      sourceIp: event.requestContext.identity.sourceIp,
    });

    return createInternalServerErrorResponse(
      "An unexpected error occurred. Please try again later."
    );
  }
};
