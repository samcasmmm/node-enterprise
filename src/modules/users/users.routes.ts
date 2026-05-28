import { Router } from 'express';
import * as controller from './users.controller.js';

const router = Router();

router.get('/health', controller.health);

export default router;
