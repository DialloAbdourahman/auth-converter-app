import {
  EXCHANGES,
  KEYS,
  Publisher,
  UserCreatedEvent,
  ForgotPasswordEvent,
} from "@daconverter/common-libs";

export class ForgotPasswordPublisher extends Publisher<ForgotPasswordEvent> {
  key: KEYS.FORGOT_PASSWORD = KEYS.FORGOT_PASSWORD;
  exchange: EXCHANGES = EXCHANGES.CONVERTER_EXCHANGE;
}
