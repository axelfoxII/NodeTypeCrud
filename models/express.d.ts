// express.d.ts

import { Usuario } from './models/usuario'; 
declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number;
        email: string;
        nombre: string;
        imagen: string | null;
        estado: boolean | null;
      };
    }
  }
}

