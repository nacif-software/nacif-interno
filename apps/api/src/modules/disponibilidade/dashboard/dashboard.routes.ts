import { Router, type RequestHandler } from 'express';
import { requireAuth } from '../../../infra/http/require-auth';
import { dashboardService } from './dashboard.service';

const get: RequestHandler = async (req, res) => {
  res.json(await dashboardService.get(req.user));
};

export const dashboardRouter = Router();
dashboardRouter.get('/dashboard', requireAuth, get);
