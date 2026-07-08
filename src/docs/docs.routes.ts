import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Override Content-Security-Policy for docs endpoints to permit Scalar CDN scripts/styles under Helmet security
router.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );
  next();
});

router.get('/openapi.yaml', (req, res) => {
  const yamlPath = path.join(__dirname, 'openapi.yaml');
  res.setHeader('Content-Type', 'text/yaml');
  res.send(fs.readFileSync(yamlPath, 'utf8'));
});

router.get('/', (req, res) => {
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
          data-url="/api/docs/openapi.yaml?v=${Date.now()}"
          data-theme="purple"></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>
  `);
});

export default router;
