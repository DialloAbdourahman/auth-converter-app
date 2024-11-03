import express, { Request, Response } from "express";
import { User } from "../models/user";
import {
  BadRequestError,
  CODE,
  NotFoundError,
  OrchestrationResult,
} from "@daconverter/common-libs";
import { validateUpdatePassword } from "../middleware/validate-request";
import { PasswordManager } from "../services/password";
import { UserUpdatedPublisher } from "../events/publishers/UserUpdatedPublisher";
import { rabbitmqWrapper } from "../rabbitmq-wrapper";

const router = express.Router();

router.patch(
  "/",
  validateUpdatePassword,
  async (req: Request, res: Response) => {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const user = await User.findById(req.currentUser?.id);

    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const match = await PasswordManager.compare(user.password, oldPassword);
    if (!match) {
      throw new BadRequestError(
        "Password does not match",
        CODE.PASSWORD_DOES_NOT_MATCH
      );
    }

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestError(
        "Passwords must be the same",
        CODE.PASSWORDS_MUST_BE_THE_SAME
      );
    }

    user.password = newPassword;
    await user.save();

    await new UserUpdatedPublisher(rabbitmqWrapper.client).publish({
      id: user.id,
      email: user.email,
      version: user.version,
      fullname: user.fullname,
    });

    OrchestrationResult.success(res, 200);
  }
);

export { router as passwordRouter };
