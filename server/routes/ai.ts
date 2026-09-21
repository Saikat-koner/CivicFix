import { Router, Request, Response, NextFunction } from 'express';
import {
  analyzeCivicIncident,
  generateCivicAssistantResponse,
  scanCivicImage,
  verifyCivicReport,
  transcribeCivicAudio,
} from '../services/gemini';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Rate limiter for AI operations
const aiLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000,
  message: 'AI processing rate limit reached. Please wait a moment before sending more requests.',
});

// POST /api/ai/scan-image - Multimodal Vision Scanner for real camera snapshots & uploaded images
router.post('/scan-image', aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image, filename, userHint } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Image data URL or image web URL is required for scanning.',
        timestamp: new Date().toISOString(),
      });
    }

    const scanResult = await scanCivicImage(image, { filename, userHint });

    res.json({
      success: true,
      data: scanResult,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/triage - Automatic category, severity, and municipal department routing
router.post('/triage', aiLimiter, async (req: Request, res: Response, next: NextFunction) => {

  try {
    const { description, imageContext } = req.body;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Description text is required for AI triage.',
        timestamp: new Date().toISOString(),
      });
    }

    const triage = await analyzeCivicIncident(description, imageContext);

    res.json({
      success: true,
      data: triage,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/chat - Civic Assistant Chatbot
router.post('/chat', aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message string is required.',
        timestamp: new Date().toISOString(),
      });
    }

    const reply = await generateCivicAssistantResponse(message);

    res.json({
      success: true,
      data: {
        reply,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/verify - Live Multimodal Gemini 3.8 Flash Incident Verification
router.post('/verify', aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image, title, description, category } = req.body;

    if (!title && !description && !image) {
      return res.status(400).json({
        success: false,
        error: 'At least an image, title, or description is required for verification.',
        timestamp: new Date().toISOString(),
      });
    }

    const verification = await verifyCivicReport({
      image,
      title: title || 'Civic Infrastructure Report',
      description: description || 'Report submitted for municipal inspection.',
      category,
    });

    res.json({
      success: true,
      data: verification,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/transcribe-audio - Live Citizen Microphone Speech Transcription via Gemini 3.8 Flash
router.post('/transcribe-audio', aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audioData, mimeType } = req.body;

    if (!audioData || typeof audioData !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Audio base64 data string is required for transcription.',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await transcribeCivicAudio(audioData, mimeType || 'audio/webm');

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
