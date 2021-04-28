import { CorsOptions } from "cors";
import socketIo, { Socket } from "socket.io";
import { getAllRecords } from "./dataDbOperations";
import { httpServer } from "./httpOperations";
import { ON_NEW_CONNECTION } from "./RestAPIconsts";
import { Client, clientsManager } from "./types/client";

const options: CorsOptions = {
    origin: (origin, callback) => {
        callback(null, true);
    },
};


export const socketIoServer = new socketIo.Server(httpServer, { cors: options });

socketIoServer.on("connection", (socket: Socket) => {
    console.log("New client connected");
    clientsManager.addClient(new Client(socket));

    socket.on('disconnect', (reason: string) => {
        console.log(`Client disconnected. Reason ${reason}`);
        clientsManager.removeClientFromSocket(socket);
    });

    const allData = JSON.stringify(getAllRecords());
    socket.emit(ON_NEW_CONNECTION, allData);
});