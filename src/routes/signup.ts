import express, { Request, Response } from "express";
import { validateSignup } from "../middleware/validate-request";
import { User } from "../models/user";
import {
  BadRequestError,
  CODE,
  OrchestrationResult,
} from "@daconverter/common-libs";
import { UserCreatedPublisher } from "../events/publishers/UserCreatedPublisher";
import { rabbitmqWrapper } from "../rabbitmq-wrapper";
import { generateJwtCode } from "../services/generate-jwt-code";

const router = express.Router();

router.post("/", validateSignup, async (req: Request, res: Response) => {
  const { email, password, fullname } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.activated) {
      throw new BadRequestError(
        "Email exist already in user",
        CODE.EMAIL_IN_USE
      );
    } else {
      throw new BadRequestError(
        "Account exist already but has not been activated, check email.",
        CODE.ACCOUNT_NOT_ACTIVATED
      );
    }
  }

  const user = User.build({ email, password, fullname });
  await user.save();

  const { code } = generateJwtCode(
    user,
    process.env.ACTIVATE_ACCOUNT_JWT_KEY as string
  );

  await new UserCreatedPublisher(rabbitmqWrapper.client).publish({
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    version: user.version,
    code,
  });

  OrchestrationResult.item(res, user, 201);
});

export { router as signupRouter };
