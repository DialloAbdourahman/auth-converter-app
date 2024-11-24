import request from "supertest";
import { app } from "../../app";
import { CODE, ForgotPasswordEvent } from "@daconverter/common-libs";
import { User } from "../../models/user";
import { rabbitmqWrapper } from "../../rabbitmq-wrapper";
import { ForgotPasswordPublisher } from "../../events/publishers/ForgotPasswordPublisher";

it("should generate a forgot password code", async () => {
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

  const activateAccountResponse = await request(app)
    .post("/api/users/forgot-password")
    .send({ email });

  expect(activateAccountResponse.status).toEqual(200);
  expect(activateAccountResponse.body.code).toBe(CODE.SUCCESS);

  expect(rabbitmqWrapper.client.createChannel).toHaveBeenCalled();

  const forgotPasswordPublisher = new ForgotPasswordPublisher(
    rabbitmqWrapper.client
  );
  const publishSpy = jest.spyOn(forgotPasswordPublisher, "publish");
  const mockEventData: ForgotPasswordEvent["data"] = {
    email: user.email,
    fullname: user.fullname,
    code: "asdf",
  };
  await forgotPasswordPublisher.publish(mockEventData);

  expect(publishSpy).toHaveBeenCalled();
  expect(publishSpy).toHaveBeenCalledWith(mockEventData);
});
