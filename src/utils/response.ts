import { ApiResponse, ErrorResponse } from "../types";

export const createResponse = (
  statusCode: number,
  body: unknown,
  additionalHeaders: Record<string, string> = {}
): ApiResponse => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      ...additionalHeaders,
    },
    body: JSON.stringify(body),
  };
};

export const createErrorResponse = (
  statusCode: number,
  error: string,
  message: string
): ApiResponse => {
  const errorResponse: ErrorResponse = {
    error,
    message,
    timestamp: new Date().toISOString(),
  };

  return createResponse(statusCode, errorResponse);
};

export const createSuccessResponse = (data: unknown): ApiResponse => {
  return createResponse(200, data);
};

export const createCreatedResponse = (data: unknown): ApiResponse => {
  return createResponse(201, data);
};

export const createBadRequestResponse = (message: string): ApiResponse => {
  return createErrorResponse(400, "Bad Request", message);
};

export const createInternalServerErrorResponse = (
  message: string = "Internal Server Error"
): ApiResponse => {
  return createErrorResponse(500, "Internal Server Error", message);
};
