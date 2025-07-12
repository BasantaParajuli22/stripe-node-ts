import 'dotenv/config';
import mongoose from "mongoose";
import express from 'express';
import paymentRoutes from './routes/payment.routes';
import bookRoutes from "./routes/book.routes";
import webhookRoutes from "./routes/webhook.routes";
import connectToDB from './config/mongoose.config';

const PORT = process.env.PORT;
const app = express();
app.use(express.json());

// For Stripe webhook
app.use("/api/webhook", express.raw({ type: "application/json" }));

app.use("/api/books", bookRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/webhook", webhookRoutes);


async function startServer() {
    try {
        await connectToDB();
        
        app.listen (PORT, ()=>{
            console.log(`Server running at http:///localhost:${process.env.PORT}`);
        } );
    } catch (error) {
        console.error(' Failed to start server: ', error);
        process.exit(1);
    }
}

startServer();