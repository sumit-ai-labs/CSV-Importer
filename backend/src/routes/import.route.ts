import { Router } from 'express';
import { importController } from '../controllers/import.controller.js';
import { handleCSVUpload } from '../middleware/upload.js';

const router = Router();

// POST /api/v1/import
router.post('/', handleCSVUpload, importController.importCSV);

export default router;
