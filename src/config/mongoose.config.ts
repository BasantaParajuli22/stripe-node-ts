import mongoose from "mongoose";

export default async function connectToDB(): Promise<void>{
    const MongoUri = process.env.MONGO_URI;
    if(!MongoUri){
        throw new Error("MONGO_URI not defined in env variable ")
    }
    try {
        await mongoose.connect(MongoUri);   
        console.log('✅ MongoDB connected');   
    } catch (error: any) {
        console.error("❌ MongoDB connection error:", error.message);
        process.exit(1);
    }
}