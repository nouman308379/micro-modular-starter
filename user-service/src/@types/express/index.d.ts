// types/express/index.d.ts
declare namespace Express {
    interface Request {
      user?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
      };
    }
  }
  