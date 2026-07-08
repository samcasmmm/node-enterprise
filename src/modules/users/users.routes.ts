import { Router } from 'express';
import * as controller from './users.controller.js';
import { isAuth } from '@/core/middlewares/auth.middleware.js';

const router = Router();

router.get('/profile', isAuth, controller.getProfile);

export default router;
