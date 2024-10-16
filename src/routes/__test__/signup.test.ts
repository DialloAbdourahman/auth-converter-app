import request from "supertest";
import { app } from "../../app";
import { CODE, UserCreatedEvent } from "@daconverter/common-libs";
import { User } from "../../models/user";
import { rabbitmqWrapper } from "../../rabbitmq-wrapper";
import { UserCreatedPublisher } from "../../events/publishers/UserCreatedPublisher";

it("should not allow a user to create an account without all the valid information", async () => {
  const email = "test@test.com";
  const password = "password 1234";

  const responseOne = await request(app).post("/api/users").send();
  expect(responseOne.status).toEqual(400);
  expect(responseOne.body.code).toBe(CODE.VALIDATION_REQUEST_ERROR);

  const responseTwo = await request(app)
    .post("/api/users")
    .send({ email: "asdf" });
  expect(responseTwo.status).toEqual(400);
  expect(responseTwo.body.code).toBe(CODE.VALIDATION_REQUEST_ERROR);

  const responseThree = await request(app)
    .post("/api/users")
    .send({ email, password: "as" });
  expect(responseThree.status).toEqual(400);
  expect(responseThree.body.code).toBe(CODE.VALIDATION_REQUEST_ERROR);

  const responseFour = await request(app)
    .post("/api/users")
    .send({ email: "asdf", password });
  expect(responseFour.status).toEqual(400);
  expect(responseFour.body.code).toBe(CODE.VALIDATION_REQUEST_ERROR);

  const responseFive = await request(app)
    .post("/api/users")
    .send({ email: "asdf", password: "ddd" });
  expect(responseFive.status).toEqual(400);
  expect(responseFive.body.code).toBe(CODE.VALIDATION_REQUEST_ERROR);

  const notCreatedUser = await User.findOne({
    email,
  });
  expect(notCreatedUser).toBeNull();
});

it("should not create an account if a user with the same email exist already", async () => {
  const email = "test@test.com";
  const password = "password 1234";
  const user = User.build({
    email,
    password,
  });
  await user.save();

  const response = await request(app)
    .post("/api/users")
    .send({ email, password });
  expect(response.status).toEqual(400);
  expect(response.body.code).toBe(CODE.EMAIL_IN_USE);
});

it("should create an account user enters all the correct information", async () => {
  const email = "test@test.com";
  const password = "password 1234";

  const response = await request(app)
    .post("/api/users")
    .send({ email, password });
  expect(response.status).toEqual(201);
  expect(response.body.email).toBe(email);

  const user = await User.findOne({ email });
  expect(user?.email).toBe(email);

  expect(user?.password).not.toBe(password);
  expect(user?.tokens.length).toBe(1);

  expect(response.headers["set-cookie"]).toBeDefined();

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
  expect(refreshCookieValue).toBe(user?.tokens[0]);
});

it("should publish an event", async () => {
  const email = "test@test.com";
  const password = "password 1234";

  const response = await request(app)
    .post("/api/users")
    .send({ email, password });
  expect(response.status).toEqual(201);
  expect(response.body.email).toBe(email);

  expect(rabbitmqWrapper.client.createChannel).toHaveBeenCalled();

  const userCreatePublisher = new UserCreatedPublisher(rabbitmqWrapper.client);
  const publishSpy = jest.spyOn(userCreatePublisher, "publish");
  const mockEventData: UserCreatedEvent["data"] = {
    id: "dd",
    email: "test@test.com",
    fullname: "test",
    version: 0,
  };
  await userCreatePublisher.publish(mockEventData);

  expect(publishSpy).toHaveBeenCalled();
  expect(publishSpy).toHaveBeenCalledWith(mockEventData);
});
