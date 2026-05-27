import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

const router = Router();

/* Dependency Injection Layer */
const service = new AuthService();
const controller = new AuthController(service);

router.post('/login', controller.login);

export default router;
