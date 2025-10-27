import { redisWrapper } from "./redis-wrapper";

const keyReserved = (ticketId: string) => `ticket:${ticketId}:reserved`;
const keyOrderItems = (orderId: string) => `order:${orderId}:items`;

export const getReservedCount = async (ticketId: string): Promise<number> => {
  const v = await redisWrapper.client.get(keyReserved(ticketId));
  return v ? parseInt(v, 10) : 0;
};

export const reserveTickets = async (
  orderId: string,
  ticketId: string,
  quantity: number,
  ttlSeconds?: number
) => {
  const cli = redisWrapper.client;
  const multi = cli.multi();

  multi.incrBy(keyReserved(ticketId), quantity);
  multi.hIncrBy(keyOrderItems(orderId), ticketId, quantity);
  if (ttlSeconds && ttlSeconds > 0) {
    multi.expire(keyOrderItems(orderId), ttlSeconds);
  }

  await multi.exec();
};

export const releaseTickets = async (
  orderId: string,
  ticketId: string,
  quantity: number
) => {
  const cli = redisWrapper.client;
  const multi = cli.multi();

  multi.decrBy(keyReserved(ticketId), quantity);
  multi.hIncrBy(keyOrderItems(orderId), ticketId, -quantity);
  await multi.exec();
};

export const releaseAllForOrder = async (orderId: string) => {
  const cli = redisWrapper.client;
  const items = await cli.hGetAll(keyOrderItems(orderId));
  if (!items || Object.keys(items).length === 0) return;

  const multi = cli.multi();
  for (const [ticketId, qtyStr] of Object.entries(items)) {
    const qty = parseInt(qtyStr, 10);
    if (qty > 0) {
      multi.decrBy(keyReserved(ticketId), qty);
    }
  }
  multi.del(keyOrderItems(orderId));
  await multi.exec();
};
