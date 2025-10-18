import express, { Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { validateRequest, requireAuth } from "@mkeventio/shared";
import { Payment, PaymentStatus } from "../models/payment";
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

      // 🔁 Idempotence check
      if (idempotencyKey) {
        const existing = await Payment.findOne({ idempotencyKey });
        if (existing) return res.status(200).send(existing);
      }

      // ✅ Simulace ceny a objednávky (v praxi by sis načetl order z Orders API)
      const amount = Math.floor(Math.random() * 100) + 20;

      const payment = Payment.build({
        orderId,
        userId: req.currentUser!.id,
        amount,
        currency: "USD",
        idempotencyKey,
        status: PaymentStatus.Pending,
      });
      await payment.save();

      // 🎲 Fake gateway simulation
      const success = Math.random() > 0.1; // 90 % success rate

      if (success) {
        payment.status = PaymentStatus.Succeeded;
        await payment.save();

        await new OrderCompletedPublisher().publish({
          id: orderId,
          eventId: "fake_event_id",
          userId: req.currentUser!.id,
          paymentId: payment.id,
          quantity: 1,
        });

        console.log(`✅ Payment success for order ${orderId}`);
        return res.status(201).send(payment);
      } else {
        payment.status = PaymentStatus.Failed;
        await payment.save();

        await new PaymentFailedPublisher().publish({
          orderId,
          reason: "Simulated failure",
        });

        console.log(`❌ Payment failed for order ${orderId}`);
        return res.status(400).send(payment);
      }
    } catch (err) {
      next(err);
    }
  }
);

export { router as createPaymentRouter };
