import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { HealthCheckResponse } from "../types/index.js";
import {
  createSuccessResponse,
  createInternalServerErrorResponse,
} from "../utils/response.js";
import { logger } from "../utils/logger.js";

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info("Health check endpoint called", {
      requestId: context.awsRequestId,
      sourceIp: event.requestContext.identity.sourceIp,
    });

    const response: HealthCheckResponse = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "unknown",
    };

    logger.info("Health check completed successfully", { response });

    return createSuccessResponse(response);
  } catch (error) {
    logger.error("Health check failed", error, {
      requestId: context.awsRequestId,
    });

    return createInternalServerErrorResponse("Health check failed");
  }
};
