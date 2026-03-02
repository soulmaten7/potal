import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.errors.map(e => e.message).join(', ') },
        });
        return;
      }
      next(error);
    }
  };
}
