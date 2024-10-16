import request from "supertest";
import { app } from "../../app";
import { CODE, UserUpdateedEvent } from "@daconverter/common-libs";
import { getLoginUser } from "../../test/get-login-user";
import { User } from "../../models/user";
import { rabbitmqWrapper } from "../../rabbitmq-wrapper";
import { UserUpdatedPublisher } from "../../events/publishers/UserUpdatedPublisher";

it("should not login user with incorrect credentials", async () => {
  const email = "test@test.com";
  const password = "password1234";

  const createUserResponse = await request(app)
    .post("/api/users")
    .send({ email, password });

  expect(createUserResponse.status).toEqual(201);
  expect(createUserResponse.body.email).toBe(email);

  const response = await request(app)
    .post("/api/users/signin")
    .send({ email, password: "password89349483" });

  expect(response.status).toEqual(400);
  expect(response.body.code).toBe(CODE.UNABLE_TO_LOGIN);
});

it("should login a user", async () => {
  let email = "test@test.com";
  let password = "password1234";
  await getLoginUser(email, password);

  const response = await request(app)
    .post("/api/users/signin")
    .send({ email, password });

  expect(response.status).toEqual(200);

  const user = await User.findOne({ email });

  expect(user?.tokens.length).toBe(2);

  expect(response.headers["set-cookie"]).toBeDefined();
});

it("should publish an event", async () => {
  let email = "test@test.com";
  let password = "password1234";
  await getLoginUser(email, password);

  const response = await request(app)
    .post("/api/users/signin")
    .send({ email, password });

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
