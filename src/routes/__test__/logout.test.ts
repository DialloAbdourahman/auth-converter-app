import request from "supertest";
import { app } from "../../app";
import { CODE } from "@daconverter/common-libs";
import { getLoginUser } from "../../test/get-login-user";
import { User } from "../../models/user";

it("should loggout a user", async () => {
  let email = "test@test.com";
  let password = "password1234";
  const { cookie } = await getLoginUser(email, password);

  const response = await request(app)
    .post("/api/users/logout")
    .set("Cookie", cookie)
    .send();
  expect(response.status).toEqual(204);

  const user = await User.findOne({ email });
  expect(user?.tokens.length).toBe(0);
});
