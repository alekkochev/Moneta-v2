import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip/deflate compression for all text/json/svg/css/js responses
app.use(compression({ level: 6 }));

// Static file serving with aggressive caching for immutable static assets
app.use(express.static(__dirname, {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filepath) => {
    // Cache images, fonts, JS, and CSS for 7 days
    if (/\.(webp|png|jpg|jpeg|svg|ico|css|js|woff2?|ttf|eot)$/i.test(filepath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    } else if (/\.html$|\.json$/i.test(filepath)) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// Route handler for MONETA Sistem page
app.get(['/sistem', '/sistem/', '/moneta-sistem', '/moneta-sistem/', '/moneta-sistiem', '/moneta-sistiem/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'sistem.html'));
});

// Fallback to index.html for unknown HTML navigation routes
app.use((req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).type('text/plain').send('404 Not Found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MONETA server running on http://0.0.0.0:${PORT}`);
});
