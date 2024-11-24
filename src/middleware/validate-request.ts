import { validateRequest } from "@daconverter/common-libs";
import { RequestHandler } from "express";
import { body, ValidationChain } from "express-validator";

// Type alias for Validator Middleware
type ValidatorMiddleware = ValidationChain | RequestHandler;

export const validateSignup: ValidatorMiddleware[] = [
  body("fullname").exists().withMessage("Fullname must be valid"),
  body("email").isEmail().withMessage("Email must be valid"),
  body("password")
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage("Password must be between 4 and 20 characters"),
  validateRequest,
];

export const validateUpdate: ValidatorMiddleware[] = [
  body("fullname").exists().withMessage("Fullname must be valid"),
  body("country").exists().withMessage("Country must be provided"),
  body("city").exists().withMessage("City must be provided"),
  body("street").exists().withMessage("Street must be provided"),
  validateRequest,
];

export const validateUpdatePassword: ValidatorMiddleware[] = [
  body("oldPassword").exists().withMessage("Old password must be valid"),
  body("newPassword")
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage("Password must be between 4 and 20 characters"),
  body("confirmNewPassword")
    .exists()
    .withMessage("Confirm new password must be provided"),
  validateRequest,
];

export const validateActivateAccount: ValidatorMiddleware[] = [
  body("code").exists().withMessage("Provide a code"),

  validateRequest,
];

export const validateGeneratePasswordCode: ValidatorMiddleware[] = [
  body("email").isEmail().withMessage("Email must be valid"),

  validateRequest,
];

export const validateResetPassword: ValidatorMiddleware[] = [
  body("code").exists().withMessage("Provide a code"),
  body("password")
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage("Password must be between 4 and 20 characters"),
  validateRequest,
];
