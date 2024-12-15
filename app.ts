import dotenv from 'dotenv';
import Server from './models/serve';
dotenv.config();

export const server= new Server();

server.listen();