import { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Resource not found',
      path: req.path,
      method: req.method,
    },
  });
};

// Made with Bob
