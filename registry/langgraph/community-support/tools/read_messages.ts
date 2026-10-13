export default async (inputData: {
  readonly channelId: string;
  readonly limit?: number;
}) => {
  const { channelId, limit = 50 } = inputData;
  const messages = [] as Array<{
    readonly id: string;
    readonly content: string;
    readonly author: string;
    readonly timestamp: string;
  }>;
  return { channelId, messages, count: messages.length };
};
