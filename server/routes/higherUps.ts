import { Router, Request, Response, NextFunction } from 'express';
import { dataStore } from '../services/store';
import { validateAppointment } from '../middleware/validation';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/higher-ups - List all municipal officials and commissioners
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const officials = dataStore.getHigherUps();
    res.json({
      success: true,
      data: officials,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/higher-ups/appointments - List booked appointments
router.get('/appointments', (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointments = dataStore.getAppointments();
    res.json({
      success: true,
      data: appointments,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/higher-ups/appointments - Book appointment with official
router.post(
  '/appointments',
  validateAppointment,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {
        issueId,
        issueCode,
        issueTitle,
        citizenName,
        citizenEmail,
        citizenPhone,
        officialId,
        officialName,
        officialRole,
        department,
        date,
        timeSlot,
        meetingMode,
        locationOrLink,
        agenda,
      } = req.body;

      const appointment = dataStore.createAppointment({
        issueId,
        issueCode,
        issueTitle,
        citizenName,
        citizenEmail,
        citizenPhone: citizenPhone || '+91 98450 12345',
        officialId,
        officialName,
        officialRole,
        department,
        date,
        timeSlot,
        meetingMode,
        locationOrLink:
          locationOrLink ||
          (meetingMode === 'in-person'
            ? 'BBMP Mayo Hall Zonal Office, MG Road'
            : meetingMode === 'video'
            ? 'https://meet.gov.in/bbmp-grievance'
            : '+91 80 2297 5500'),
        agenda: agenda || 'Grievance Review and Escalation Consultation',
      });

      res.status(201).json({
        success: true,
        data: appointment,
        message: `Appointment confirmed with ${officialName} for ${date} at ${timeSlot}. Reference: ${appointment.grievanceReferenceCode}`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/higher-ups/petitions - List filed petitions
router.get('/petitions', (req: Request, res: Response, next: NextFunction) => {
  try {
    const petitions = dataStore.getPetitions();
    res.json({
      success: true,
      data: petitions,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/higher-ups/petitions - Submit formal grievance petition
router.post('/petitions', (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      issueId,
      issueCode,
      issueTitle,
      citizenName,
      targetHigherUpId,
      targetHigherUpName,
      targetHigherUpRole,
      dissatisfactionReason,
      escalationType,
      severity,
    } = req.body;

    if (!issueId || !dissatisfactionReason || !targetHigherUpName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required petition parameters: issueId, dissatisfactionReason, and targetHigherUpName are required.',
        timestamp: new Date().toISOString(),
      });
    }

    const petition = dataStore.createPetition({
      issueId,
      issueCode: issueCode || '#CFX-ESCALATED',
      issueTitle: issueTitle || 'Civic Infrastructure Escalation',
      citizenName: citizenName || req.user?.name || 'Concerned Citizen',
      targetHigherUpId: targetHigherUpId || 'official-1',
      targetHigherUpName,
      targetHigherUpRole: targetHigherUpRole || 'Zonal Commissioner',
      dissatisfactionReason,
      escalationType: escalationType || 'unresolved_delay',
      severity: severity || 'High',
    });

    res.status(201).json({
      success: true,
      data: petition,
      message: `Formal petition ${petition.petitionNumber} registered and forwarded to ${targetHigherUpName}.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
