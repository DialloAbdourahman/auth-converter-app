export const rabbitmqWrapper = {
  client: {
    createChannel: jest.fn().mockResolvedValue({
      assertExchange: jest.fn().mockResolvedValue(true),
      publish: jest.fn().mockImplementation(() => {
        return true;
      }),
      close: jest.fn().mockResolvedValue(true),
    }),
  },
};
