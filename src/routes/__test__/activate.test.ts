import request from "supertest";
import { app } from "../../app";
import { CODE, UserUpdateedEvent } from "@daconverter/common-libs";
import { User } from "../../models/user";
import { rabbitmqWrapper } from "../../rabbitmq-wrapper";
import { UserUpdatedPublisher } from "../../events/publishers/UserUpdatedPublisher";
import { generateJwtCode } from "../../services/generate-jwt-code";

it("should activate the account", async () => {
  const email = "test@test.com";
  const password = "password 1234";
  const fullname = "test";

  const createUserResponse = await request(app)
    .post("/api/users")
    .send({ email, password, fullname });
  expect(createUserResponse.status).toEqual(201);
  expect(createUserResponse.body.data.email).toBe(email);

  const user = await User.findById(createUserResponse.body.data.id);

  if (!user) return;
  const { code } = generateJwtCode(
    user,
    process.env.ACTIVATE_ACCOUNT_JWT_KEY as string
  );

  const activateAccountResponse = await request(app)
    .post("/api/users/activate")
    .send({ code });

  expect(activateAccountResponse.status).toEqual(200);
  expect(activateAccountResponse.body.code).toBe(CODE.SUCCESS);

  const userAgain = await User.findById(user.id);
  expect(userAgain?.activated).toBe(true);

  expect(rabbitmqWrapper.client.createChannel).toHaveBeenCalled();

  const updatedUser = new UserUpdatedPublisher(rabbitmqWrapper.client);
  const publishSpy = jest.spyOn(updatedUser, "publish");
  const mockEventData: UserUpdateedEvent["data"] = {
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    version: user.version,
  };
  await updatedUser.publish(mockEventData);

  expect(publishSpy).toHaveBeenCalled();
  expect(publishSpy).toHaveBeenCalledWith(mockEventData);
});

it("should not activate the account if the code is fake", async () => {
  const email = "test@test.com";
  const password = "password 1234";
  const fullname = "test";

  const createUserResponse = await request(app)
    .post("/api/users")
    .send({ email, password, fullname });
  expect(createUserResponse.status).toEqual(201);
  expect(createUserResponse.body.data.email).toBe(email);

  const activateAccountResponse = await request(app)
    .post("/api/users/activate")
    .send({ code: "asdf" });

  expect(activateAccountResponse.status).toEqual(400);
  expect(activateAccountResponse.body.code).toBe(CODE.BAD_REQUEST);
});
