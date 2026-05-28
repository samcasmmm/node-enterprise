import { type Request, type Response } from 'express';
import { getOpenApiSpec } from './docs.service.js';

export function getJson(req: Request, res: Response): void {
  res.setHeader('Content-Type', 'application/json');
  res.json(getOpenApiSpec());
}

export function renderUi(req: Request, res: Response): void {
  res.send(`
    <!doctype html>
    <html>
      <head>
        <title>API Reference | Scalar</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <script
          id="api-reference"
          data-url="/api/docs/openapi.json?v=${Date.now()}"
          data-theme="purple"></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>
  `);
}
