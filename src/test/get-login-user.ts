import request from "supertest";
import { app } from "../app";
import { User } from "../models/user";

export const getLoginUser = async (email: string, password: string) => {
  await request(app)
    .post("/api/users")
    .send({ email, password, fullname: "test" });

  const updatedUser = await User.findOne({ email });
  if (updatedUser) {
    updatedUser.activated = true;
    await updatedUser.save();
  }

  const response = await request(app)
    .post("/api/users/signin")
    .send({ email, password, fullname: "test" });

  return { cookie: Array.from(response.headers["set-cookie"]) };
};
