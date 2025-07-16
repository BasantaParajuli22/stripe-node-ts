import * as userService from '../services/auth.service';
import * as jwtUtils from '../utils/jwtUtils';
import { Request, Response } from 'express';

export async function registerUser(req: Request, res: Response): Promise<void>  {
    try {
        const {username, email, password} = req.body;
        //register without role 
        //not taking role as input from user  
        const newUser = await userService.registerUser(username, email, password);
        
        const token = await jwtUtils.generateToken(
            newUser._id.toString(), newUser.email, newUser.role 
            );
        res.status(201).json({
            success: true,
            message: `user has been successfully registered`,
            access_token: token,
        });     
    } catch (error: any) {
        res.status(500).json({ error: error.message });
        return;
    }
}

export async function loginuser(req: Request, res: Response): Promise<void>  {
    try {  
        const { email, password } = req.body;
        if(!email || !password){
            res.status(500).json( {success: false, message: `Email and password are required` });
            return;
        }

        const currentUser = await userService.authenticateUser(email, password);
        if(!currentUser){
            res.status(500).json( {success: false, message: `Wrong credentials` });
            return;
        }

        const token = await jwtUtils.generateToken(
            currentUser._id.toString(), currentUser.email, currentUser.role 
        );
        res.status(200).json({
            success: true,
            message: `user has been successfully loggedIn`,
            access_token: token
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
        return;
    }
}