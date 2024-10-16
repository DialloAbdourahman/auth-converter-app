import request from "supertest";
import { app } from "../../app";
import { CODE, UserUpdateedEvent } from "@daconverter/common-libs";
import { getLoginUser } from "../../test/get-login-user";
import { User } from "../../models/user";
import { rabbitmqWrapper } from "../../rabbitmq-wrapper";
import { UserUpdatedPublisher } from "../../events/publishers/UserUpdatedPublisher";

it("should update the user info of a logged in user", async () => {
  let email = "test@test.com";
  let password = "password1234";
  const { cookie } = await getLoginUser(email, password);

  const fullname = "Test";
  const country = "Test";
  const city = "Test";
  const street = "Test";

  const response = await request(app)
    .put("/api/users")
    .set("Cookie", cookie)
    .send({
      fullname,
      country,
      city,
      street,
    });
  expect(response.status).toEqual(200);

  const user = await User.findOne({ email });
  expect(user?.fullname).toBe(fullname);
  expect(user?.address.country).toBe(country);
  expect(user?.address.city).toBe(city);
  expect(user?.address.street).toBe(street);
});

it("should publish an event", async () => {
  let email = "test@test.com";
  let password = "password1234";
  const { cookie } = await getLoginUser(email, password);

  const fullname = "Test";
  const country = "Test";
  const city = "Test";
  const street = "Test";

  const response = await request(app)
    .put("/api/users")
    .set("Cookie", cookie)
    .send({
      fullname,
      country,
      city,
      street,
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

it("should not update the info of a user if he submits incomplete info", async () => {
  let email = "test@test.com";
  let password = "password1234";
  const { cookie } = await getLoginUser(email, password);

  const fullname = "Test";
  const country = "Test";
  const city = "Test";
  const street = "Test";

  const response = await request(app)
    .put("/api/users")
    .set("Cookie", cookie)
    .send({
      fullname,
      country,
      city,
    });
  expect(response.status).toEqual(400);
  expect(response.body.code).toBe(CODE.VALIDATION_REQUEST_ERROR);

  const responseTwo = await request(app)
    .put("/api/users")
    .set("Cookie", cookie)
    .send({
      fullname,
      country,
      street,
    });
  expect(responseTwo.status).toEqual(400);
  expect(responseTwo.body.code).toBe(CODE.VALIDATION_REQUEST_ERROR);

  const responseThree = await request(app)
    .put("/api/users")
    .set("Cookie", cookie)
    .send();
  expect(responseThree.status).toEqual(400);
  expect(responseThree.body.code).toBe(CODE.VALIDATION_REQUEST_ERROR);
});

it("should not update the user info of an unauthenticated user", async () => {
  const fullname = "Test";
  const country = "Test";
  const city = "Test";
  const street = "Test";

  const response = await request(app).put("/api/users").send({
    fullname,
    country,
    city,
    street,
  });
  expect(response.status).toEqual(401);
  expect(response.body.code).toBe(CODE.NO_ACCESS_TOKEN);
});
