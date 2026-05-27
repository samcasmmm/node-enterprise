import { Router } from 'express';
import authRouter from '../modules/auth/auth.routes.js';
import tenantRouter from '../modules/tenants/tenants.routes.js';
import bookRouter from '../modules/books/books.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/tenants', tenantRouter); // maps GET /api/tenants
apiRouter.use('/tenant', tenantRouter);   // maps GET /api/tenant/users
apiRouter.use('/books', bookRouter);     // maps GET /api/books and POST /api/books

export default apiRouter;
