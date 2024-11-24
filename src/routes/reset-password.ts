import express, { Request, Response } from "express";
import { validateResetPassword } from "../middleware/validate-request";
import { User } from "../models/user";
import {
  BadRequestError,
  CODE,
  NotFoundError,
  OrchestrationResult,
} from "@daconverter/common-libs";
import { rabbitmqWrapper } from "../rabbitmq-wrapper";
import { decodeJwtCode } from "../services/decode-jwt-code";
import { UserUpdatedPublisher } from "../events/publishers/UserUpdatedPublisher";

const router = express.Router();

router.post("/", validateResetPassword, async (req: Request, res: Response) => {
  const { code, password } = req.body;

  try {
    const { id } = decodeJwtCode(
      code,
      process.env.FORGOT_PASSWORD_JWT_KEY as string
    );

    const user = await User.findById(id);

    if (!user) {
      throw new NotFoundError("Account not found", CODE.NOT_FOUND);
    }

    if (!user.activated) {
      throw new BadRequestError(
        "Account must be activated first, check you email",
        CODE.ACCOUNT_NOT_ACTIVATED
      );
    }

    user.password = password;
    await user.save();

    await new UserUpdatedPublisher(rabbitmqWrapper.client).publish({
      id: user.id,
      email: user.email,
      version: user.version,
      fullname: user.fullname,
    });
  } catch (error) {
    throw new BadRequestError("Cannot decode token", CODE.BAD_REQUEST);
  }

  OrchestrationResult.success(res);
});

export { router as resetPasswordRouter };
