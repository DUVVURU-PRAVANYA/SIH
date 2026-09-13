import { Router } from 'express';
import { ivrController } from './ivr.controller';

export const ivrRouter = Router();

ivrRouter.post('/call/start', (req, res) => ivrController.startCall(req, res));
ivrRouter.post('/call/dtmf', (req, res) => ivrController.handleDtmf(req, res));
ivrRouter.post('/call/symptom', (req, res) => ivrController.handleSymptomSpeech(req, res));
ivrRouter.post('/call/end', (req, res) => ivrController.endCall(req, res));
ivrRouter.get('/call/status/:phone', (req, res) => ivrController.checkCallerStatus(req, res));
ivrRouter.get('/call/:sessionId', (req, res) => ivrController.getSession(req, res));
ivrRouter.get('/demo-callers', (req, res) => ivrController.getDemoCallers(req, res));
