export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
}

export interface UserSubscriptionRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  fields?: Record<string, string | number>;
  groups?: string[];
  subscribed_at?: string;
  ip_address?: string;
  status?: string;
}

export interface UserSubscriptionResponse {
  success: boolean;
  message: string;
  subscriberId?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
}

export interface UserUnsubscribeResponse {
  success: boolean;
  message: string;
  subscriberId?: string;
}
