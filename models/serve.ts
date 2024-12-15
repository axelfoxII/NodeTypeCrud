import express, { Application } from 'express';
import userRoutes from '../routes/usuario.route';
import cors from 'cors';
import db from '../database/connection';
import multer from 'multer';
import path from 'path';
class Server {

    private app: Application;
    private port: string;
    private apiPaths = {
        usuarios: '/api/usuarios'
    }

    constructor() {
        this.app = express();
        this.port = process.env.PORT || '8000';
        this.dbConnection();
        this.middlewares();
        this.routes();

    }

    async dbConnection(){

        try {

            await db.authenticate();
            console.log('Database onLine..');
            
        } catch (error) {
            console.error(error);
        }


    }

    middlewares() {
        // CORS (Cross-Origin Resource Sharing) es un mecanismo de seguridad implementado en los navegadores que permite controlar cómo se pueden realizar solicitudes HTTP entre diferentes dominios (orígenes).
        this.app.use(cors());
    
        // Habilitar lectura del body
        this.app.use(express.json());

        this.app.use(express.urlencoded({ extended: true }));

        this.app.use(express.static('public'));
    
        // Servir la carpeta 'uploads' como estática
        this.app.use("/uploads", express.static(path.join(__dirname,"../../uploads")));
          //console.log('Carpeta estática de uploads:', path.join(__dirname, 'uploads'));
        // Middleware de manejo de errores de Multer
        
        this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (err instanceof multer.MulterError) {
                // Error específico de Multer
                res.status(400).json({
                    error: err.message,
                });
            } else if (err) {
                // Otros errores
                res.status(500).json({
                    error: err.message,
                });
            } else {
                next(); // Si no hay error, pasa al siguiente middleware
            }
        });
    }
    

    routes() {
        this.app.use(this.apiPaths.usuarios, userRoutes)
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log(`Server is running on port ${this.port}`);
        });
    }

}

export default Server;