import express, { Request, Response } from "express";
import { validateSignup } from "../middleware/validate-request";
import { User } from "../models/user";
import { unsetCookies } from "../services/unset-cookies";
import { OrchestrationResult } from "@daconverter/common-libs";
import { UserUpdatedPublisher } from "../events/publishers/UserUpdatedPublisher";
import { rabbitmqWrapper } from "../rabbitmq-wrapper";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { refresh } = req.cookies;
  if (!refresh) {
    OrchestrationResult.success(res);
    return;
  }

  const foundUser = await User.findOne({ tokens: refresh });
  if (!foundUser) {
    unsetCookies(res);
    OrchestrationResult.success(res);
    return;
  }

  const newTokensArray = foundUser.tokens.filter((token) => {
    return token !== refresh;
  });
  foundUser.tokens = newTokensArray;
  await foundUser.save();

  await new UserUpdatedPublisher(rabbitmqWrapper.client).publish({
    id: foundUser.id,
    email: foundUser.email,
    version: foundUser.version,
    fullname: foundUser.fullname,
  });

  unsetCookies(res);

  OrchestrationResult.success(res);
});

export { router as logoutRouter };
