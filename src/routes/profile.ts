import express, { Request, Response } from "express";
import { User } from "../models/user";
import {
  CODE,
  NotFoundError,
  OrchestrationResult,
} from "@daconverter/common-libs";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const user = await User.findById(req.currentUser?.id);

  if (!user) {
    throw new NotFoundError("User not found", CODE.NOT_FOUND);
  }

  OrchestrationResult.item(res, user);
});

export { router as profileRouter };
