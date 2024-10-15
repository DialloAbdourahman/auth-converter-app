import express, { Request, Response } from "express";
import { validateSignup } from "../middleware/validate-request";
import { User } from "../models/user";
import { CODE, UnauthorizedError } from "@daconverter/common-libs";
import jwt from "jsonwebtoken";
import { generateTokens } from "../services/generate-tokens";
import { setCookies } from "../services/set-cookies";
import { unsetCookies } from "../services/unset-cookies";

const router = express.Router();

router.post("/", validateSignup, async (req: Request, res: Response) => {
  const { refresh } = req.cookies;
  if (!refresh) {
    throw new UnauthorizedError("Not authorized", CODE.UNAUTHORIZED);
  }
  unsetCookies(res);

  const foundUser = await User.findOne({ token: refresh });
  if (!foundUser) {
    try {
      const decoded: any = jwt.verify(
        refresh,
        process.env.REFRESH_TOKEN_JWT_KEY as string
      );

      const hackedUser = await User.findOne({ id: decoded.id });
      if (hackedUser) {
        hackedUser.token = undefined;
        await hackedUser?.save();
      }

      res.status(200).send();
    } catch (error: any) {
      throw new UnauthorizedError("Cannot decode refresh token");
    }
    return;
  }

  try {
    const decoded: any = jwt.verify(
      refresh,
      process.env.REFRESH_TOKEN_JWT_KEY as string
    );

    if (decoded?.id !== foundUser.id) {
      console.log("hey there");

      throw new UnauthorizedError("Not authorized");
    }

    const { accessToken, refreshToken } = generateTokens(foundUser);
    foundUser.token = refreshToken;
    await foundUser.save();

    setCookies(res, accessToken, refreshToken);

    res.status(200).send();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError(
        "Refresh token has expired, login again.",
        CODE.REFRESH_TOKEN_EXPIRED
      );
    } else {
      throw new UnauthorizedError("Cannot decode refresh token");
    }
  }
});

export { router as refreshRouter };
