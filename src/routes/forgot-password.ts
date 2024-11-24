import express, { Request, Response } from "express";
import { validateGeneratePasswordCode } from "../middleware/validate-request";
import { User } from "../models/user";
import {
  BadRequestError,
  CODE,
  NotFoundError,
  OrchestrationResult,
} from "@daconverter/common-libs";
import { rabbitmqWrapper } from "../rabbitmq-wrapper";
import { generateJwtCode } from "../services/generate-jwt-code";
import { ForgotPasswordPublisher } from "../events/publishers/ForgotPasswordPublisher";

const router = express.Router();

router.post(
  "/",
  validateGeneratePasswordCode,
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      throw new NotFoundError("User not found", CODE.NOT_FOUND);
    }

    if (!existingUser.activated) {
      throw new BadRequestError(
        "Account must be activated first, check you email",
        CODE.ACCOUNT_NOT_ACTIVATED
      );
    }

    const { code } = generateJwtCode(
      existingUser,
      process.env.FORGOT_PASSWORD_JWT_KEY as string
    );

    await new ForgotPasswordPublisher(rabbitmqWrapper.client).publish({
      email: existingUser.email,
      fullname: existingUser.fullname,
      code,
    });

    OrchestrationResult.success(res, 200);
  }
);

export { router as forgotPasswordRouter };
