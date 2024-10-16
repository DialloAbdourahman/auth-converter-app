import {
  EXCHANGES,
  KEYS,
  Publisher,
  UserUpdateedEvent,
} from "@daconverter/common-libs";

export class UserUpdatedPublisher extends Publisher<UserUpdateedEvent> {
  key: KEYS.USER_UPDATED = KEYS.USER_UPDATED;
  exchange: EXCHANGES = EXCHANGES.CONVERTER_EXCHANGE;
}
