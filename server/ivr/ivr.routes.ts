import { Router } from 'express';
import { ivrController } from './ivr.controller';

export const ivrRouter = Router();

ivrRouter.post('/call/start', (req, res) => ivrController.startCall(req, res));
ivrRouter.post('/call/dtmf', (req, res) => ivrController.handleDtmf(req, res));
ivrRouter.post('/call/symptom', (req, res) => ivrController.handleSymptomSpeech(req, res));
ivrRouter.post('/call/end', (req, res) => ivrController.endCall(req, res));
ivrRouter.get('/call/status/:phone', (req, res) => ivrController.checkCallerStatus(req, res));
ivrRouter.get('/call/:sessionId', (req, res) => ivrController.getSession(req, res));
const ttsMemoryCache = new Map<string, Buffer>();

ivrRouter.get('/tts', async (req, res) => {
  try {
    const text = ((req.query.text as string) || '').trim();
    const lang = ((req.query.lang as string) || 'ta').toLowerCase();

    if (!text) {
      return res.status(400).send('Missing text parameter');
    }

    const cacheKey = `${lang}:${text}`;
    if (ttsMemoryCache.has(cacheKey)) {
      const cached = ttsMemoryCache.get(cacheKey)!;
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached);
    }

    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text.slice(0, 200))}`;
    const upstreamRes = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send('Upstream voice service unavailable');
    }

    const arrayBuf = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    if (ttsMemoryCache.size > 250) {
      ttsMemoryCache.clear();
    }
    ttsMemoryCache.set(cacheKey, buffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buffer);
  } catch (err: any) {
    console.error('[IVR TTS Proxy Error]:', err);
    res.status(500).send(err.message || 'TTS Error');
  }
});
