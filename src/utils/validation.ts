import Joi from "joi";
import { UserRegistrationRequest } from "../types/index.js";

export const userRegistrationSchema = Joi.object<UserRegistrationRequest>({
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
});

export const validateUserRegistration = (
  data: unknown
): {
  isValid: boolean;
  error?: string;
  value?: UserRegistrationRequest;
} => {
  const { error, value } = userRegistrationSchema.validate(data, {
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
