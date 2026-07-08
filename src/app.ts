import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { ResponseBuilderMiddleware } from './core/response/response.middleware.js';

import docsRouter from './docs/docs.routes.js';
import usersRouter from './modules/users/users.routes.js';

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
    message: 'Antigravity Enterprise API Online',
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
  });
});

// Modular Routes Registration
app.use('/api/docs', docsRouter);
app.use('/api/users', usersRouter);

// Global Professional Error Handlers
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
export { app };
