import request from "supertest";
import { app } from "../../app";
import { CODE } from "@daconverter/common-libs";
import { getLoginUser } from "../../test/get-login-user";

it("should allow a user to view his profile", async () => {
  let email = "test@test.com";
  let password = "password1234";
  const { cookie } = await getLoginUser(email, password);

  const response = await request(app)
    .get("/api/users/profile")
    .set("Cookie", cookie)
    .send();
  expect(response.status).toEqual(200);
  expect(response.body.data.email).toBe(email);
});

it("should not allow a user to view his profile if they are not logged in", async () => {
  const response = await request(app).get("/api/users/profile").send();
  expect(response.status).toEqual(401);
  expect(response.body.code).toBe(CODE.NO_ACCESS_TOKEN);
});
