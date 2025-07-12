// src/routes/webhookRoute.ts
import express from "express";
import { handleStripeWebhook } from "../controllers/webhook.controller";

const router = express.Router();

router.post("/", handleStripeWebhook);

export default router;
