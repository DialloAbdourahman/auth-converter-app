import request from "supertest";
import { app } from "../../app";
import { CODE, UserUpdateedEvent } from "@daconverter/common-libs";
import { getLoginUser } from "../../test/get-login-user";
import { UserUpdatedPublisher } from "../../events/publishers/UserUpdatedPublisher";
import { rabbitmqWrapper } from "../../rabbitmq-wrapper";

it("should allow a user to update his password and emit and event", async () => {
  let email = "test@test.com";
  let password = "password1234";
  const { cookie } = await getLoginUser(email, password);

  const response = await request(app)
    .patch("/api/users/password")
    .set("Cookie", cookie)
    .send({
      oldPassword: password,
      newPassword: "password12345",
      confirmNewPassword: "password12345",
    });
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

it("should not allow a user to update his password if he enters a wrong password", async () => {
  let email = "test@test.com";
  let password = "password1234";
  const { cookie } = await getLoginUser(email, password);

  const response = await request(app)
    .patch("/api/users/password")
    .set("Cookie", cookie)
    .send({
      oldPassword: "password",
      newPassword: "password12345",
      confirmNewPassword: "password12345",
    });
  expect(response.status).toEqual(400);
  expect(response.body.code).toBe(CODE.PASSWORD_DOES_NOT_MATCH);
});

it("should not allow a user to update his password if the new password and confirm new password are not the same", async () => {
  let email = "test@test.com";
  let password = "password1234";
  const { cookie } = await getLoginUser(email, password);

  const response = await request(app)
    .patch("/api/users/password")
    .set("Cookie", cookie)
    .send({
      oldPassword: password,
      newPassword: "password12345",
      confirmNewPassword: "password123asdf45",
    });
  expect(response.status).toEqual(400);
  expect(response.body.code).toBe(CODE.PASSWORDS_MUST_BE_THE_SAME);
});
