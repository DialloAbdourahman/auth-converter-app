import {
  EXCHANGES,
  KEYS,
  Publisher,
  UserCreatedEvent,
} from "@daconverter/common-libs";

export class UserCreatedPublisher extends Publisher<UserCreatedEvent> {
  key: KEYS.USER_CREATED = KEYS.USER_CREATED;
  exchange: EXCHANGES = EXCHANGES.CONVERTER_EXCHANGE;
}
