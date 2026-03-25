import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE"]
        }
    });

    io.on('connection', (socket) => {
        console.log('🔗 New client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('🔴 Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        // Return a dummy object to prevent crashes in serverless environments
        return {
            emit: () => {},
            on: () => {},
            to: () => ({ emit: () => {} }),
            in: () => ({ emit: () => {} }),
        } as any;
    }
    return io;
};
