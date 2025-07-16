import express from 'express';
import * as authService from '../controllers/auth.controller';

const router = express.Router();

router.post('/register', authService.registerUser);
router.post('/login', authService.loginuser);


export default router;