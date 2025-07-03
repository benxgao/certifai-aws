import Joi from "joi";
import { UserSubscriptionRequest } from "../types/index.js";

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
  subscribed_at: Joi.string().isoDate().optional().messages({
    "string.isoDate": "subscribed_at must be a valid ISO date string",
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
