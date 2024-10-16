import express, { Request, Response } from "express";
import { validateSignup } from "../middleware/validate-request";
import { User } from "../models/user";
import { unsetCookies } from "../services/unset-cookies";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { refresh } = req.cookies;
  if (!refresh) {
    res.status(204).send();
    return;
  }

  const foundUser = await User.findOne({ tokens: refresh });
  if (!foundUser) {
    unsetCookies(res);
    res.status(204).send();
    return;
  }

  const newTokensArray = foundUser.tokens.filter((token) => {
    return token !== refresh;
  });
  foundUser.tokens = newTokensArray;
  await foundUser.save();

  unsetCookies(res);

  res.status(204).send();
});

export { router as logoutRouter };
