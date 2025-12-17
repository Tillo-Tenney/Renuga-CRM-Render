import express from 'express';
import { login, logout, validateToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/validate', validateToken);

export default router;
