import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { ResponseBuilderMiddleware } from './core/middlewares/response.middleware.js';

import docsRouter from './modules/docs/docs.routes.js';
import authRouter from './modules/auth/auth.routes.js';
import tenantRouter from './modules/tenants/tenants.routes.js';
import bookRouter from './modules/books/books.routes.js';

import { notFoundMiddleware, errorHandlerMiddleware } from './core/middlewares/error.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(ResponseBuilderMiddleware);

app.get('/', (req, res) => {
  res.json({
    message: 'Antigravity Multi-Tenant Enterprise ERP API Online',
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
  });
});

// Modular Routes Registration
app.use('/api/docs', docsRouter);
app.use('/api/auth', authRouter);
app.use('/api/tenants', tenantRouter);
app.use('/api/tenant', tenantRouter);
app.use('/api/books', bookRouter);

// Global Professional Error Handlers
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
export { app };
