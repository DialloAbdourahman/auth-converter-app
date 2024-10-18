import express, { Request, Response } from "express";
import { validateSignup } from "../middleware/validate-request";
import { User } from "../models/user";
import { CODE, UnauthorizedError } from "@daconverter/common-libs";
import jwt from "jsonwebtoken";
import { generateTokens } from "../services/generate-tokens";
import { setCookies } from "../services/set-cookies";
import { unsetCookies } from "../services/unset-cookies";
import { UserUpdatedPublisher } from "../events/publishers/UserUpdatedPublisher";
import { rabbitmqWrapper } from "../rabbitmq-wrapper";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { refresh } = req.cookies;
  if (!refresh) {
    throw new UnauthorizedError("Not authorized", CODE.UNAUTHORIZED);
  }
  unsetCookies(res);

  const foundUser = await User.findOne({ tokens: refresh });
  if (!foundUser) {
    try {
      const decoded: any = jwt.verify(
        refresh,
        process.env.REFRESH_TOKEN_JWT_KEY as string
      );
      console.log("Reuse detection mechanism");

      const hackedUser = await User.findById(decoded.id);

      if (hackedUser) {
        hackedUser.tokens = [];
        await hackedUser?.save();

        await new UserUpdatedPublisher(rabbitmqWrapper.client).publish({
          id: hackedUser.id,
          email: hackedUser.email,
          version: hackedUser.version,
          fullname: hackedUser.fullname,
        });
      }

      throw new UnauthorizedError("Reuse detection", CODE.REUSE_DETECTION);
    } catch (error: any) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError("Cannot decode refresh token");
      }
      throw error;
    }
  }

  try {
    const decoded: any = jwt.verify(
      refresh,
      process.env.REFRESH_TOKEN_JWT_KEY as string
    );

    if (decoded?.id !== foundUser.id) {
      throw new UnauthorizedError("Not authorized");
    }

    const { accessToken, refreshToken } = generateTokens(foundUser);
    const newTokensArray = foundUser.tokens.filter((token) => {
      return token !== refresh;
    });

    newTokensArray.push(refreshToken);
    foundUser.tokens = newTokensArray;

    await foundUser.save();

    await new UserUpdatedPublisher(rabbitmqWrapper.client).publish({
      id: foundUser.id,
      email: foundUser.email,
      version: foundUser.version,
      fullname: foundUser.fullname,
    });

    setCookies(res, accessToken, refreshToken);

    res.status(200).send();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError(
        "Refresh token has expired, login again.",
        CODE.REFRESH_TOKEN_EXPIRED
      );
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Cannot decode refresh token");
    }

    throw error;
  }
});

export { router as refreshRouter };
