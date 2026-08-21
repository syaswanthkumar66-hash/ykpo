import express from 'express';
import path from 'path';
import apiApp from './api/index.js'; // Note: .js extension for ESM resolution in tsx

const app = express();
const PORT = 3000;

// Mount the API routes from the extracted Vercel serverless function
app.use(apiApp);

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA routing fallback: send index.html for all client-side routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler to catch any middleware errors (e.g. from multer)
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      details: err.message || err.toString()
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
