import express from 'express';
import * as paymentController from '../controllers/stripe.controller';

const router = express.Router();

router.post('/create-checkout-session', paymentController.createCheckoutSession);
router.post("/create-subscription", paymentController.createSubscription);


export default router;
