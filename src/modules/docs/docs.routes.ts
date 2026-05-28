import { Router } from 'express';
import * as controller from './docs.controller.js';

const router = Router();

// Override Content-Security-Policy for docs endpoints to permit Scalar CDN scripts/styles under Helmet security
router.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );
  next();
});

router.get('/openapi.json', controller.getJson);
router.get('/', controller.renderUi);

export default router;
