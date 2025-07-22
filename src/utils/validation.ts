import Joi from "joi";
import {
  UserSubscriptionRequest,
  UserJoinGroupRequest,
} from "../types/index.js";

export const userSubscriptionSchema = Joi.object<UserSubscriptionRequest>({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  firstName: Joi.string().min(1).max(50).optional().messages({
    "string.min": "First name must be at least 1 character long",
    "string.max": "First name must not exceed 50 characters",
  }),
  lastName: Joi.string().min(1).max(50).optional().messages({
    "string.min": "Last name must be at least 1 character long",
    "string.max": "Last name must not exceed 50 characters",
  }),
  fields: Joi.object()
    .pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number()))
    .optional(),
  groups: Joi.array().items(Joi.string()).optional(),
  subscribed_at: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    .optional()
    .messages({
      "string.pattern.base":
        "subscribed_at must be in format 'yyyy-MM-dd HH:mm:ss'",
    }),
  ip_address: Joi.string().ip().optional().messages({
    "string.ip": "ip_address must be a valid IP address",
  }),
  status: Joi.string()
    .valid("active", "unsubscribed", "unconfirmed", "bounced", "junk")
    .optional()
    .messages({
      "any.only":
        "status must be one of: active, unsubscribed, unconfirmed, bounced, junk",
    }),
});

export const validateUserSubscription = (
  data: unknown
): {
  isValid: boolean;
  error?: string;
  value?: UserSubscriptionRequest;
} => {
  const { error, value } = userSubscriptionSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return { isValid: false, error: errorMessage };
  }

  return { isValid: true, value };
};

export const userJoinGroupSchema = Joi.object<UserJoinGroupRequest>({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  groupName: Joi.string().min(1).max(100).required().messages({
    "string.min": "Group name must be at least 1 character long",
    "string.max": "Group name must not exceed 100 characters",
    "any.required": "Group name is required",
  }),
});

export const validateUserJoinGroup = (
  data: unknown
): {
  isValid: boolean;
  error?: string;
  value?: UserJoinGroupRequest;
} => {
  const { error, value } = userJoinGroupSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return { isValid: false, error: errorMessage };
  }

  return { isValid: true, value };
};
