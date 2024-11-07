import request from "supertest";
import { app } from "../../app";
import { CODE, UserUpdateedEvent } from "@daconverter/common-libs";
import { getLoginUser } from "../../test/get-login-user";
import { User } from "../../models/user";
import { rabbitmqWrapper } from "../../rabbitmq-wrapper";
import { UserUpdatedPublisher } from "../../events/publishers/UserUpdatedPublisher";

it("should loggout a user and send an event", async () => {
  let email = "test@test.com";
  let password = "password1234";

  const { cookie } = await getLoginUser(email, password);

  const response = await request(app)
    .post("/api/users/logout")
    .set("Cookie", cookie)
    .send();
  expect(response.status).toEqual(200);

  const user = await User.findOne({ email });
  expect(user?.tokens.length).toBe(0);

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
