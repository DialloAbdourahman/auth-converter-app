import express, { Request, Response } from "express";
import { User } from "../models/user";
import { BadRequestError, CODE } from "@daconverter/common-libs";
import { PasswordManager } from "../services/password";
import { generateTokens } from "../services/generate-tokens";
import { setCookies } from "../services/set-cookies";
import { UserUpdatedPublisher } from "../events/publishers/UserUpdatedPublisher";
import { rabbitmqWrapper } from "../rabbitmq-wrapper";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { refresh } = req.cookies;

  const user = await User.findOne({ email });

  if (!user) {
    throw new BadRequestError("Unable to login", CODE.UNABLE_TO_LOGIN);
  }

  const match = await PasswordManager.compare(user.password, password);
  if (!match) {
    throw new BadRequestError("Unable to login", CODE.UNABLE_TO_LOGIN);
  }

  const newTokensArray = user.tokens.filter((token) => {
    return token !== refresh;
  });

  const { accessToken, refreshToken } = generateTokens(user);
  newTokensArray.push(refreshToken);
  user.tokens = newTokensArray;
  await user.save();

  await new UserUpdatedPublisher(rabbitmqWrapper.client).publish({
    id: user.id,
    email: user.email,
    version: user.version,
    fullname: user.fullname,
  });

  setCookies(res, accessToken, refreshToken);

  res.status(200).send(user);
});

export { router as signinRouter };
