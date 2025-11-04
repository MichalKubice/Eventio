import express, { Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import {
  validateRequest,
  requireAuth,
  BadRequestError,
} from "@mkeventio/shared";
import { Payment, PaymentStatus } from "../models/payment";
import { OrderCache, OrderStatus } from "../models/order-cache";
import { OrderCompletedPublisher } from "../events/publishers/order-completed-publisher";
import { PaymentFailedPublisher } from "../events/publishers/payment-failed-publisher";

const router = express.Router();

router.post(
  "/api/payments",
  requireAuth,
  [
    body("orderId").not().isEmpty().withMessage("orderId required"),
    body("idempotencyKey").optional().isString(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId, idempotencyKey } = req.body;

      if (idempotencyKey) {
        const existing = await Payment.findOne({ idempotencyKey });
        if (existing) return res.status(200).send(existing);
      }

      const order = await OrderCache.findById(orderId);
      if (!order) {
        throw new BadRequestError("Order not found in Payments cache");
      }

      if (order.status === OrderStatus.Cancelled) {
        throw new BadRequestError("Cannot pay for a cancelled order");
      }

      if (order.status === OrderStatus.Complete) {
        throw new BadRequestError("Order is already completed");
      }

      const amount = order.pricePerTicket * order.quantity;
      const payment = Payment.build({
        orderId,
        userId: req.currentUser!.id,
        amount,
        currency: "USD",
        idempotencyKey,
        status: PaymentStatus.Pending,
      });
      await payment.save();

      // 3. Fake gateway simulation
      const success = Math.random() > 0.1; // 90 % success rate

      if (success) {
        payment.status = PaymentStatus.Succeeded;
        await payment.save();

        await new OrderCompletedPublisher().publish({
          id: order.id,
          eventId: order.eventId,
          userId: order.userId,
          paymentId: payment.id,
          quantity: order.quantity,
        });

        order.status = OrderStatus.Complete;
        await order.save();
        console.log(`Payment success for order ${orderId}`);
        return res.status(201).send(payment);
      } else {
        payment.status = PaymentStatus.Failed;
        await payment.save();

        await new PaymentFailedPublisher().publish({
          orderId,
          reason: "Simulated failure",
        });

        console.log(`Payment failed for order ${orderId}`);
        return res.status(400).send(payment);
      }
    } catch (err) {
      next(err);
    }
  }
);

export { router as createPaymentRouter };
