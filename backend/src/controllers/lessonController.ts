import { Request, Response, NextFunction } from 'express';
import * as lessonService from '../services/lessonService';
import { createLessonSchema, updateLessonSchema, lessonQuerySchema, approvalSchema } from '../utils/validation';
import { AppError } from '../middleware/errorHandler';

// GET /api/lessons
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = lessonQuerySchema.parse(req.query);
    const result = await lessonService.listLessons(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// GET /api/lessons/filters
export async function filters(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const options = await lessonService.getFilterOptions();
    res.json(options);
  } catch (error) {
    next(error);
  }
}

// GET /api/lessons/:id
export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lesson = await lessonService.getLessonById(req.params.id);
    res.json(lesson);
  } catch (error) {
    next(error);
  }
}

// POST /api/lessons
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const data = createLessonSchema.parse(req.body);
    const lesson = await lessonService.createLesson(data, req.user);
    res.status(201).json(lesson);
  } catch (error) {
    next(error);
  }
}

// PATCH /api/lessons/:id
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const data = updateLessonSchema.parse(req.body);
    const lesson = await lessonService.updateLesson(req.params.id, data, req.user);
    res.json(lesson);
  } catch (error) {
    next(error);
  }
}

// POST /api/lessons/:id/approve/pm
export async function approvePM(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const input = approvalSchema.parse(req.body);
    const lesson = await lessonService.processApproval(req.params.id, 'pm', input, req.user);
    res.json(lesson);
  } catch (error) {
    next(error);
  }
}

// POST /api/lessons/:id/approve/pmo
export async function approvePMO(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const input = approvalSchema.parse(req.body);
    const lesson = await lessonService.processApproval(req.params.id, 'pmo', input, req.user);
    res.json(lesson);
  } catch (error) {
    next(error);
  }
}

// POST /api/lessons/:id/approve/department
export async function approveDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const input = approvalSchema.parse(req.body);
    const lesson = await lessonService.processApproval(req.params.id, 'department', input, req.user);
    res.json(lesson);
  } catch (error) {
    next(error);
  }
}

// GET /api/lessons/:id/audit
export async function getAudit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const audit = await lessonService.getLessonAudit(req.params.id);
    res.json(audit);
  } catch (error) {
    next(error);
  }
}
