import express, { Request, Response } from "express";
import { validateUpdate } from "../middleware/validate-request";
import { User } from "../models/user";
import { CODE, NotFoundError } from "@daconverter/common-libs";
import { rabbitmqWrapper } from "../rabbitmq-wrapper";
import { UserUpdatedPublisher } from "../events/publishers/UserUpdatedPublisher";

const router = express.Router();

router.put("/", validateUpdate, async (req: Request, res: Response) => {
  const { fullname, country, city, street } = req.body;

  let user = await User.findById(req.currentUser?.id);

  if (!user) {
    throw new NotFoundError("User not found", CODE.NOT_FOUND);
  }

  user.fullname = fullname;
  user.address.country = country;
  user.address.city = city;
  user.address.street = street;
  await user.save();

  await new UserUpdatedPublisher(rabbitmqWrapper.client).publish({
    id: user.id,
    email: user.email,
    version: user.version,
    fullname: user.fullname,
  });

  res.status(200).send(user);
});

export { router as updateRouter };
