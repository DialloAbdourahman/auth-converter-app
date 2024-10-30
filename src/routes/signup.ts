import express, { Request, Response } from "express";
import { validateSignup } from "../middleware/validate-request";
import { User } from "../models/user";
import { BadRequestError, CODE } from "@daconverter/common-libs";
import { generateTokens } from "../services/generate-tokens";
import { setCookies } from "../services/set-cookies";
import { UserCreatedPublisher } from "../events/publishers/UserCreatedPublisher";
import { rabbitmqWrapper } from "../rabbitmq-wrapper";

const router = express.Router();

router.post("/", validateSignup, async (req: Request, res: Response) => {
  const { email, password, fullname } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new BadRequestError("Email already in user", CODE.EMAIL_IN_USE);
  }

  const user = User.build({ email, password, fullname });
  await user.save();

  const { accessToken, refreshToken } = generateTokens(user);

  user.tokens = [refreshToken];
  await user.save();

  await new UserCreatedPublisher(rabbitmqWrapper.client).publish({
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    version: user.version,
  });

  setCookies(res, accessToken, refreshToken);

  res.status(201).send(user);
});

export { router as signupRouter };
