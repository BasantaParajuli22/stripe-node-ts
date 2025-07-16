import jsonwebtoken from "jsonwebtoken";
import 'dotenv/config'

const jwtSecretKey =process.env.JWT_SECRET_KEY;

export async function generateToken(id:string, email:string, role:string) {
    
    if( !jwtSecretKey || typeof jwtSecretKey !== "string"){
    throw new Error("jwt is not defined or not string");
    }
    const token = jsonwebtoken.sign(
        {id: id, email: email, role: role}, 
        jwtSecretKey,                      
        {expiresIn: '30h'},                 
    ) 
    return token;
}