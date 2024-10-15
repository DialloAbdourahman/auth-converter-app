import express, { Request, Response } from "express";
import { User } from "../models/user";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const user = await User.findById(req.currentUser?.id);

  res.status(200).send(user);
});

export { router as profileRouter };
