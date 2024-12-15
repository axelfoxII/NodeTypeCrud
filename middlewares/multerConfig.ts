// middlewares/multerConfig.ts
import multer from 'multer';
import path from 'path';

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Carpeta donde se guardarán las imágenes
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname); // Obtener extensión del archivo
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`); // Nombre único
    }
});

// Middleware de Multer
export const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limitar tamaño del archivo (2 MB)
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }

        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png)'));
    }
});

