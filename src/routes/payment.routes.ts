import express from 'express';
import * as paymentController from '../controllers/stripe.controller';

const router = express.Router();

router.post("/checkout", paymentController.createCheckoutSession);
router.post("/subscription", paymentController.createSubscription);
router.post("/unlock-premium", paymentController.unlockPremiumFeatures);
router.post("/metered-subscription", paymentController.createMeteredBilling);


export default router;
