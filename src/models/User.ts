import mongoose from "mongoose";

export interface IUser extends mongoose.Document{
    _id: mongoose.Types.ObjectId,
    username?: string,
    email: string,
    password: string,
    role: "admin" | "user";
    createdAt?:Date,
    updatedAt?:Date,
}

const UserSchema = new mongoose.Schema<IUser>({
    username:{
        type: String,
        trim: true,
        default: "default name",
    },
    email:{
        type: String,
        required : true,
        trim: true,
    },
    password:{
        type: String,
        required : true,
    },
    role:{
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },

}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
export default User;

