import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes';
import { initDatabase } from './src/server/db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON and URL-encoded request body parser with generous limit for product image uploads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // Prevent Express default HTML error page on malformed JSON bodies
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Malformed JSON payload in request body.', success: false });
    }
    next(err);
  });

  // Statically serve product images and uploads from public directory
  const publicDir = path.resolve(__dirname, 'public');
  const imagesDir = path.resolve(__dirname, 'public/images');
  const uploadsDir = path.resolve(__dirname, 'public/uploads');

  app.use('/images', express.static(imagesDir));
  app.use('/src/assets/images', express.static(imagesDir));
  app.use('/uploads', express.static(uploadsDir));
  app.use(express.static(publicDir));

  // Mount backend REST API endpoints
  app.use('/api', apiRouter);

  // Initialize database (MongoDB Atlas or safe in-memory fallback)
  await initDatabase();

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Serve static files from production build dist directory
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Development mode: Mount Vite middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        host: '0.0.0.0',
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Marvi Mart] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Marvi Mart] Fatal server startup error:', err);
  process.exit(1);
});
