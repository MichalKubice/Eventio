import { rabbitWrapper } from "../index"

const connectRabbitWithRetry = async (
  url: string,
  retries = 10,
  delay = 3000
) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await rabbitWrapper.connect(url);
      console.log("✅ Connected to RabbitMQ");
      return;
    } catch (err) {
      console.warn(`🐇 RabbitMQ not ready (attempt ${i}/${retries})`);
      if (i === retries) throw err;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

export { connectRabbitWithRetry };