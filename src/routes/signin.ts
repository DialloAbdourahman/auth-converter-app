import express, { Request, Response } from "express";
import { validateSignup } from "../middleware/validate-request";
import { User } from "../models/user";
import { BadRequestError, CODE } from "@daconverter/common-libs";
import { PasswordManager } from "../services/password";
import { generateTokens } from "../services/generate-tokens";
import { setCookies } from "../services/set-cookies";

const router = express.Router();

router.post("/", validateSignup, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new BadRequestError("Unable to login", CODE.BAD_REQUEST);
  }

  const match = await PasswordManager.compare(user.password, password);

  if (!match) {
    throw new BadRequestError("Unable to login", CODE.BAD_REQUEST);
  }

  const { accessToken, refreshToken } = generateTokens(user);

  user.token = refreshToken;
  await user.save();

  setCookies(res, accessToken, refreshToken);

  res.status(200).send(user);
});

export { router as signinRouter };
