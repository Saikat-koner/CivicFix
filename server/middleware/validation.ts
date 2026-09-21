import { Request, Response, NextFunction } from 'express';

export function validateCreateIssue(req: Request, res: Response, next: NextFunction) {
  const { title, description, category, district, address, location } = req.body;

  const validCategories = ['Roads', 'Utilities', 'Parks', 'Traffic', 'Sanitation', 'Safety'];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Invalid title: Title must be at least 3 characters long.',
      timestamp: new Date().toISOString(),
    });
  }

  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      error: `Invalid category: Must be one of ${validCategories.join(', ')}.`,
      timestamp: new Date().toISOString(),
    });
  }

  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Invalid location: GPS coordinates (lat, lng numbers) are required.',
      timestamp: new Date().toISOString(),
    });
  }

  if (!address || typeof address !== 'string' || address.trim().length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Invalid address: A readable location address is required.',
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

export function validateVote(req: Request, res: Response, next: NextFunction) {
  const { voteType } = req.body;
  if (voteType !== 'stillThere' && voteType !== 'isFixed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid voteType: Must be either "stillThere" or "isFixed".',
      timestamp: new Date().toISOString(),
    });
  }
  next();
}

export function validateComment(req: Request, res: Response, next: NextFunction) {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length < 1) {
    return res.status(400).json({
      success: false,
      error: 'Comment text cannot be empty.',
      timestamp: new Date().toISOString(),
    });
  }
  next();
}

export function validateAppointment(req: Request, res: Response, next: NextFunction) {
  const { officialId, date, timeSlot, meetingMode, citizenName, citizenEmail } = req.body;

  if (!officialId || !date || !timeSlot || !meetingMode || !citizenName || !citizenEmail) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: officialId, date, timeSlot, meetingMode, citizenName, and citizenEmail are required.',
      timestamp: new Date().toISOString(),
    });
  }

  next();
}
