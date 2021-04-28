import { Socket } from "socket.io";


export class Client {
    socket: Socket;
    auth_token: number;

    constructor(socket: Socket) {
        this.socket = socket;
        this.auth_token = 0;
    }
};

export class ClientsManager {
    clients: Client[];

    constructor() {
        this.clients = [];
    }

    addClient(newClient: Client) {
        this.clients.push(newClient);
    }

    removeClient(toRemove: Client) {
        const index = this.clients.indexOf(toRemove);
        if (index > -1)
            this.clients.splice(index, 1);

        return;
    }

    removeClientFromSocket(toRemove: Socket) {
        const client = this.findClient(toRemove);
        if (client !== undefined) {
            this.removeClient(client);
        }
    }

    findClient(socket: Socket): Client | undefined {
        return this.clients.find(c => c.socket === socket);
    }

    broadcastData(event: string, data: string) {
        this.clients.forEach(cl => {
            cl.socket.emit(event, data);
        });
    }
};

export const clientsManager: ClientsManager = new ClientsManager();