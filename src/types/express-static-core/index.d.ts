// src/types/express-serve-static-core/index.d.ts

import { IUser } from '../../models/User';

declare module 'express-serve-static-core' {
  interface Request {
    /** ajouté par authMiddleware */
    user?: IUser;
  }
}
