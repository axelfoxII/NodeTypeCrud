import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';

dotenv.config();

let mysqlConnection: mysql.Connection | undefined;

const getConnection = async (): Promise<mysql.Connection> => {
    if (!mysqlConnection) {
        mysqlConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true,
        });
    }
    
    return mysqlConnection;
    
};

export default getConnection;



/* import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';

dotenv.config();

let mysqlConnection:mysql.Connection | undefined;

const getConnection = async ():Promise<mysql.Connection>=>{

    try {
        if (!mysqlConnection) {
            mysqlConnection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                multipleStatements: true,
            });
            console.log("Conexión establecida exitosamente");
        }
        return mysqlConnection;
    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
        throw error; // Lanza el error para que el manejador lo capture
    }

}

export default getConnection; */