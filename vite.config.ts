import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const ttsCache = new Map<string, Buffer>();

function ttsProxyPlugin(): Plugin {
  return {
    name: 'tts-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/tts')) {
          return next();
        }

        try {
          const urlObj = new URL(req.url, 'http://localhost:5173');
          const text = (urlObj.searchParams.get('text') || '').trim();
          const lang = (urlObj.searchParams.get('lang') || 'ta').toLowerCase();

          if (!text) {
            res.statusCode = 400;
            return res.end('Missing text parameter');
          }

          const cacheKey = `${lang}:${text}`;
          if (ttsCache.has(cacheKey)) {
            const cached = ttsCache.get(cacheKey)!;
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.end(cached);
          }

          const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text.slice(0, 200))}`;
          const upstream = await fetch(googleUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });

          if (!upstream.ok) {
            res.statusCode = upstream.status;
            return res.end('TTS Upstream failed');
          }

          const arrayBuf = await upstream.arrayBuffer();
          const buf = Buffer.from(arrayBuf);
          if (ttsCache.size > 250) ttsCache.clear();
          ttsCache.set(cacheKey, buf);

          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.end(buf);
        } catch (err: any) {
          res.statusCode = 500;
          return res.end(err.message || 'TTS Error');
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || './',
  plugins: [
    tailwindcss(),
    react(),
    ttsProxyPlugin(),
  ],
})
