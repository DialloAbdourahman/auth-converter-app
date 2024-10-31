import express, { Request, Response } from "express";
import { User } from "../models/user";
import { OrchestrationResult } from "@daconverter/common-libs";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const user = await User.findById(req.currentUser?.id);

  OrchestrationResult.item(res, user);
});

export { router as profileRouter };
