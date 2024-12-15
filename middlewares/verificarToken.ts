import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../database/configJwt';

export const verificarToken = async (req: Request, res: Response, next: NextFunction) => {
    let token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ message: 'No hay token, autorización denegada' });
        return; // Esto asegura que TypeScript entienda que el código no sigue
    }

    try {
        // Aquí TypeScript ya sabe que `token` es un string
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { id: number; email: string };

        req.usuario = {
            id: decoded.id,
            email: decoded.email,
            nombre: '',  // Valores predeterminados
            imagen: null,
            estado: null
        };

        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
};


/* getUsuarios(): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get(this.baseUrl, { headers }); // Pasar los headers con el token
  }

  getUsuario(id: string): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get(`${this.baseUrl}/${id}`, { headers }); // Ruta protegida con token
  }

  postUsuario(data: any): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post(this.baseUrl, data, { headers });
  }

  putUsuario(id: string, data: any): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.put(`${this.baseUrl}/${id}`, data, { headers });
  }

  deleteUsuario(id: string): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.delete(`${this.baseUrl}/${id}`, { headers });
  } */