import { redisWrapper } from "@mkeventio/shared";
import { releaseAllForOrder } from "@mkeventio/shared";
import { OrderExpiredPublisher } from "../publishers/order-expired-publisher";

export const listenForReservationExpirations = async () => {
  const sub = redisWrapper.client.duplicate();
  await sub.connect();
  await sub.pSubscribe("__keyevent@0__:expired", async (message) => {
    if (!message.startsWith("order:")) return;
    const orderId = message.split(":")[1];
    console.log(`⏰ Reservation expired for order ${orderId}`);

    await releaseAllForOrder(orderId);
    await new OrderExpiredPublisher().publish({ orderId: orderId });
  });
  console.log("📡 Listening for reservation expirations (Tickets)");
};
