import { Request, Response, NextFunction } from 'express'; // Importamos los tipos necesarios para las rutas en Express
import Usuario from '../models/usuario'; // Importamos el modelo Usuario para interactuar con la base de datos
import bcrypt from 'bcryptjs'; // Importamos bcrypt para encriptar las contraseñas
import getConnection from '../database/connectionQuery'; // Función para obtener la conexión a la base de datos
import path from 'path'; // Importamos path para manejar las rutas de archivos
import fs from 'fs/promises'; // Importamos fs (File System) para interactuar con el sistema de archivos de forma asíncrona

import { Op } from 'sequelize'; // Importamos el operador 'Op' de Sequelize para consultas avanzadas
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../database/configJwt';


// Ruta para obtener todos los usuarios
export const getUsuarios = async (req: Request, res: Response) => {
    // Usamos Sequelize para obtener todos los usuarios, excluyendo el campo 'password'
    const usuarios = await Usuario.findAll({
        attributes: { exclude: ['password'] } // Excluye el campo 'password'
    });

    res.json(usuarios); // Respondemos con todos los usuarios, sin el campo 'password', en formato JSON
};

// Ruta para obtener un usuario por su ID
export const getUsuario = async (req: Request, res: Response) => {
    const { id } = req.params; // Obtenemos el ID del usuario desde los parámetros de la URL
    // Buscamos al usuario por su ID, excluyendo el campo 'password'
    const usuario = await Usuario.findByPk(id, {
        attributes: { exclude: ['password'] } // Excluye el campo 'password'
    });

    if (usuario) {
        res.json(usuario); // Si el usuario existe, lo respondemos en formato JSON
    } else {
        res.status(404).json({ msg: 'No existe el usuario' }); // Si no se encuentra el usuario, respondemos con un error 404
    }
}

// Ruta para crear un nuevo usuario
export const postUsuario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { body } = req; // Obtenemos el cuerpo de la solicitud

        // Validamos que los campos 'nombre', 'email' y 'password' estén presentes
        const { nombre, email, password } = body;
        if (!nombre || !email || !password) {
            res.status(400).json({ message: 'Los campos nombre, email y contraseña son obligatorios' });
            return;
        }

        // Verificamos si el email ya está registrado
        const existeEmail = await Usuario.findOne({ where: { email } });
        if (existeEmail) {
            // Si el correo ya existe, eliminamos la imagen si fue subida
            if (req.file) {
                await fs.unlink(path.resolve(req.file.path)); // Eliminamos la imagen del servidor
            }
            res.status(400).json({ message: `El email ${email} ya está registrado` });
            return;
        }

        // Verificamos si se subió una imagen, si no, asignamos null al campo imagen
        if (req.file) {
            body.imagen = req.file.filename; // Si se subió una imagen, asignamos su nombre al campo 'imagen'
        } else {
            body.imagen = null;  // Si no se sube una imagen, asignamos null
        }

        // Encriptamos la contraseña antes de guardarla
        const salt = bcrypt.genSaltSync(10); // Generamos un 'salt' para encriptar la contraseña
        body.password = bcrypt.hashSync(password, salt); // Encriptamos la contraseña

        // Creamos un nuevo usuario con los datos validados y encriptados
        const usuario = Usuario.build(body);
        await usuario.save(); // Guardamos el usuario en la base de datos

        // Excluimos la contraseña en la respuesta para no exponerla
        const { password: _, ...usuarioSinPassword } = usuario.toJSON();
        res.status(201).json(usuarioSinPassword); // Respondemos con el usuario creado (sin contraseña)
    } catch (error) {
        next(error); // Si hay algún error, lo pasamos al manejador de errores global
    }
};

// Ruta para actualizar un usuario
export const putUsuario = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params; // Obtenemos el ID desde los parámetros de la URL
    const body = req.body;     // Obtenemos los datos del cuerpo de la solicitud

    try {
        // Buscamos al usuario por su ID
        const usuario = await Usuario.findByPk(id);
        const usuarioData = usuario?.toJSON(); // Obtenemos los datos del usuario en formato JSON

        if (!usuario) {
            res.status(404).json({ message: `El usuario no existe` });
            return;
        }

        // Verificamos si el email está siendo modificado y si ya existe en otro usuario (excepto el actual)
        // Validación del email
        if (body.email) {
            const emailExistente = await Usuario.findOne({

                /* id: { [Op.ne]: id }:Esto asegura que se filtre la consulta de manera que el id del usuario en la base de datos no sea igual al id proporcionado en la solicitud (id viene de los parámetros de la URL). De esta forma, la consulta buscará un usuario con el mismo email, pero que no tenga el mismo id que el usuario actual. */

                where: { email: body.email, id: { [Op.ne]: id } }
            });

            if (emailExistente) {
                res.status(400).json({ message: `El email ${body.email} ya está registrado` });

                if (req.file) {

                    await fs.unlink(path.resolve(req.file.path));
                }

                return; // Detenemos la ejecución aquí si el email ya existe
            }
        }

        // Gestión de la imagen
        if (req.file) {
            // Caso 1: Nueva imagen subida
            const nuevaImagen = req.file.filename;

            // Eliminar imagen anterior si existe
            if (usuarioData?.imagen) {
                const imagePath = path.resolve(`uploads/${usuarioData.imagen}`);
                try {
                    if (req.file) {

                        await fs.unlink(path.resolve(imagePath));
                    }
                } catch (error) {
                    console.error(`Error al eliminar la imagen anterior: ${error}`);
                }
            }

            // Actualizamos el campo imagen en el cuerpo de la solicitud
            body.imagen = nuevaImagen;
        } else {
            // Caso 3: No hay cambios en la imagen
            delete body.imagen; // No modificamos el campo 'imagen'
        }

        //--------

        // Si la contraseña fue cambiada, la encriptamos antes de actualizarla
        if (body.password && body.password.trim() !== '') {
            const salt = bcrypt.genSaltSync(10); // Generamos un 'salt' para la nueva contraseña
            body.password = bcrypt.hashSync(body.password, salt); // Encriptamos la nueva contraseña
        } else {
            // Si no se envió un nuevo password o está vacío, eliminamos el campo del body
            delete body.password;
        }

        // Actualizamos el usuario con los nuevos datos
        await usuario.update(body);

        // Excluimos la contraseña en la respuesta
        const { password: _, ...usuarioSinPassword } = usuario.toJSON();

        // Respondemos con el usuario actualizado (sin contraseña)
        res.json(usuarioSinPassword);

    } catch (error) {
        console.error(error); // Imprimimos el error en la consola
        res.status(500).json({ message: 'Error interno del servidor' }); // Respondemos con un error 500 si ocurre un problema
    }
};

// Ruta para eliminar un usuario
export const deleteUsuario = async (req: Request, res: Response) => {
    const { id } = req.params; //Obtenemos el ID desde los parámetros de la URL

    try {
        const connection = await getConnection(); // Obtenemos la conexión a la base de datos

        // Verificamos si el usuario existe en la base de datos
        const [rows] = await connection.query("SELECT * FROM usuarios WHERE id = ?", [id]);

        if ((rows as any).length === 0) {
            return res.status(404).json({ message: "Archivo no encontrado" });
        }

        const { imagen } = (rows as any)[0]; // Obtenemos el nombre de la imagen asociada al usuario

        if(imagen == null){

             // Eliminamos al usuario de la base de datos
        await connection.query("DELETE FROM usuarios WHERE id = ?", [id]);
        res.json({ message: "Archivo eliminado correctamente" });

        }else{

             // Eliminamos el archivo de la imagen del servidor
        await fs.unlink(path.resolve(`uploads/${imagen}`));
        console.log("Imagen eliminada del servidor");

        // Eliminamos al usuario de la base de datos
        await connection.query("DELETE FROM usuarios WHERE id = ?", [id]);
        res.json({ message: "Archivo eliminado correctamente" });

        }

       

    } catch (error) {
        console.error(error); // Imprimimos el error en la consola
        res.status(500).json({ message: "Error al eliminar el archivo" }); // Respondemos con un error 500 si ocurre un problema
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        // Buscar el usuario por su email
        const usuario = await Usuario.findOne({ where: { email } });
        
        if (!usuario) {
            return res.status(401).json({ msg: 'El email no está registrado.' });
        }

        const usuarioData = usuario.toJSON();

        // Verificar si el usuario está activo
        if (!usuarioData.estado) {
            return res.status(401).json({ msg: 'El usuario no está activo.' });
        }

        // Comparar la contraseña proporcionada con la almacenada en la base de datos
        const validPassword = await bcrypt.compare(password, usuarioData.password);
        if (!validPassword) {
            return res.status(400).json({ msg: 'La contraseña es incorrecta.' });
        }

        // Generar un token JWT
        const token = jwt.sign(
            {
                id: usuarioData.id,
                nombre: usuarioData.nombre,
                imagen: usuarioData.imagen,
            },
            JWT_SECRET,
            { expiresIn: '24h' } // Token válido por 24 horas
        );

        // Eliminar datos sensibles del usuario antes de enviarlos en la respuesta
        const { password: _, estado: __, ...user } = usuarioData;

        // Responder con el token y los datos del usuario
        return res.json({ token, user });
    } catch (error) {
        console.error('Error en el servidor:', error);
        return res.status(500).json({ msg: 'Ocurrió un error en el servidor. Inténtalo de nuevo más tarde.' });
    }
};