import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export async function getThresholds(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const thresholds = await prisma.configThreshold.findMany({ orderBy: { key: 'asc' } });
    res.json(thresholds);
  } catch (error) {
    next(error);
  }
}

export async function updateThresholds(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updates: Array<{ key: string; value: string }> = req.body;
    if (!Array.isArray(updates)) {
      res.status(400).json({ error: 'Expected array of { key, value } objects' });
      return;
    }

    const results = await Promise.all(
      updates.map((u) =>
        prisma.configThreshold.update({
          where: { key: u.key },
          data: { value: u.value },
        })
      )
    );

    res.json(results);
  } catch (error) {
    next(error);
  }
}
