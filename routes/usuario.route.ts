// routes/usuarios.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { 
    getUsuario, 
    getUsuarios, 
    postUsuario, 
    putUsuario, 
    deleteUsuario,
    login 
} from '../controllers/usuarios.controller';

import { upload } from '../middlewares/multerConfig';
import { verificarToken } from '../middlewares/verificarToken'; 

const router = Router();

// Middleware para manejar errores asíncronos en el controlador
const asyncHandler = (fn: Function) => {
  return function(req: Request, res: Response, next: NextFunction) {
    return fn(req, res, next).catch(next);
  };
};

// Rutas de usuarios
router.get('/',verificarToken, asyncHandler(getUsuarios));
router.get('/:id',verificarToken, asyncHandler(getUsuario));
router.post('/', verificarToken, upload.single('imagen'), asyncHandler(postUsuario));
router.put('/:id',verificarToken, upload.single('imagen'), asyncHandler(putUsuario));
router.delete('/:id',verificarToken,asyncHandler(deleteUsuario));
router.post('/login', asyncHandler(login));

export default router;
