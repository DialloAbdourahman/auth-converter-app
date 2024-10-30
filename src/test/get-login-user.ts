import request from "supertest";
import { app } from "../app";

export const getLoginUser = async (email: string, password: string) => {
  const response = await request(app)
    .post("/api/users")
    .send({ email, password, fullname: "test" });

  return { cookie: Array.from(response.headers["set-cookie"]) };
};
