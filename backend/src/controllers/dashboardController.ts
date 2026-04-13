import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboardService';
import { dashboardQuerySchema } from '../utils/validation';

export async function getKPIs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = dashboardQuerySchema.parse(req.query);
    const kpis = await dashboardService.getKPIs(query);
    res.json(kpis);
  } catch (error) {
    next(error);
  }
}

export async function getBreakdowns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = dashboardQuerySchema.parse(req.query);
    const breakdowns = await dashboardService.getBreakdowns(query);
    res.json(breakdowns);
  } catch (error) {
    next(error);
  }
}

export async function getWatchouts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = dashboardQuerySchema.parse(req.query);
    const watchouts = await dashboardService.getWatchouts(query);
    res.json(watchouts);
  } catch (error) {
    next(error);
  }
}

export async function getTopDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = dashboardQuerySchema.parse(req.query);
    const drivers = await dashboardService.getTopDrivers(query);
    res.json(drivers);
  } catch (error) {
    next(error);
  }
}
