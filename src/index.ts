import 'dotenv/config';
import mongoose from "mongoose";
import express from 'express';
import paymentRoutes from './routes/payment.routes';
import bookRoutes from "./routes/book.routes";
import webhookRoutes from "./routes/webhook.routes";
import authRoutes from "./routes/auth.routes";
import connectToDB from './config/mongoose.config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google DNS

const PORT = process.env.PORT;
const app = express();


// For Stripe webhook
// We use express.raw() so the Stripe webhook signature verification
//  doesn't break due to automatic body parsing. //eg => Whitespace added // Newlines inserted
// Stripe signs the raw request body,
//  and to verify that signature, you need the exact, unparsed body.
app.use("/api/webhook", express.raw({ type: "application/json" }));
app.use("/api/webhook", webhookRoutes);

//now parse other incoming req to json //normally
app.use(express.json());
app.use("/api/books", bookRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/auth", authRoutes);


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