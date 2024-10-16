import request from "supertest";
import { app } from "../../app";
import { CODE, UserUpdateedEvent } from "@daconverter/common-libs";
import { getLoginUser } from "../../test/get-login-user";
import { User } from "../../models/user";
import { rabbitmqWrapper } from "../../rabbitmq-wrapper";
import { UserUpdatedPublisher } from "../../events/publishers/UserUpdatedPublisher";

it("should allow a user to refresh his token", async () => {
  let email = "test@test.com";
  let password = "password1234";
  const { cookie } = await getLoginUser(email, password);

  const response = await request(app)
    .post("/api/users/token")
    .set("Cookie", cookie)
    .send();
  expect(response.status).toEqual(200);

  const user = await User.findOne({ email });

  expect(user?.tokens.length).toBe(1);

  const cookies = Array.from(response.headers["set-cookie"]) as string[];
  const accessCookie = cookies?.find((cookie: string) =>
    cookie.startsWith("access=")
  );
  const refreshCookie = cookies?.find((cookie: string) =>
    cookie.startsWith("refresh=")
  );
  expect(accessCookie).toBeDefined();
  expect(refreshCookie).toBeDefined();

  const refreshCookieValue = refreshCookie?.match(/refresh=([^;]+)/)?.[1];
  expect(refreshCookieValue).toBe(user?.tokens[1]);
});

it("should publish an event", async () => {
  let email = "test@test.com";
  let password = "password1234";
  const { cookie } = await getLoginUser(email, password);

  const response = await request(app)
    .post("/api/users/token")
    .set("Cookie", cookie)
    .send();
  expect(response.status).toEqual(200);

  expect(rabbitmqWrapper.client.createChannel).toHaveBeenCalled();

  const updated = new UserUpdatedPublisher(rabbitmqWrapper.client);
  const publishSpy = jest.spyOn(updated, "publish");
  const mockEventData: UserUpdateedEvent["data"] = {
    id: "dd",
    email: "test@test.com",
    fullname: "test",
    version: 0,
  };
  await updated.publish(mockEventData);

  expect(publishSpy).toHaveBeenCalled();
  expect(publishSpy).toHaveBeenCalledWith(mockEventData);
});

it("should not allow an unauthenticated user to refresh his token", async () => {
  let email = "test@test.com";
  let password = "password1234";
  await getLoginUser(email, password);

  const response = await request(app).post("/api/users/token").send();

  expect(response.status).toEqual(401);
  expect(response.body.code).toBe(CODE.UNAUTHORIZED);
});
