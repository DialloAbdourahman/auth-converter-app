import express, { Request, Response } from "express";
import { User } from "../models/user";
import {
  BadRequestError,
  CODE,
  NotFoundError,
  OrchestrationResult,
} from "@daconverter/common-libs";
import { decodeJwtCode } from "../services/decode-jwt-code";
import { UserUpdatedPublisher } from "../events/publishers/UserUpdatedPublisher";
import { rabbitmqWrapper } from "../rabbitmq-wrapper";
import { validateActivateAccount } from "../middleware/validate-request";

const router = express.Router();

router.post(
  "/",
  validateActivateAccount,
  async (req: Request, res: Response) => {
    const { code } = req.body;

    try {
      const { id } = decodeJwtCode(
        code,
        process.env.ACTIVATE_ACCOUNT_JWT_KEY as string
      );

      const user = await User.findById(id);

      if (!user) {
        throw new NotFoundError("Account not found", CODE.NOT_FOUND);
      }

      if (user.activated) {
        OrchestrationResult.success(res);
        return;
      }

      user.activated = true;
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
  }
);

export { router as activateRouter };
