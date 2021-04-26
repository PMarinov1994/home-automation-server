import express, { Application, Request, Response, NextFunction } from 'express';
import Nedb, { Cursor, DatastoreOptions, FilterQuery } from 'nedb';
import path from 'path';
import socketIo, { Socket, ServerOptions } from 'socket.io';
import httpModule from 'http';

import cors, { CorsOptions } from 'cors';

import { Data } from './types/data';;

const maxDataCount: number = 500;
const readingsDb: Nedb<Data> = new Nedb<Data>({
    filename: "db",
    autoload: true,
});

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../build')));

const webPageResource: string = path.join(__dirname, '../build', 'index.html');

const options: CorsOptions = {
    origin: (origin, callback) => {
        callback(null, true);
    },
};

const connectedClients: Socket[] = [];

app.get('/', (req: Request, res: Response, next: NextFunction) => res.sendFile(webPageResource));
app.get('/living-room', (req: Request, res: Response, next: NextFunction) => res.sendFile(webPageResource));
app.get('/bed-room', (req: Request, res: Response, next: NextFunction) => res.sendFile(webPageResource));
app.get('/kids-room', (req: Request, res: Response, next: NextFunction) => res.sendFile(webPageResource));
app.get('/outside', (req: Request, res: Response, next: NextFunction) => res.sendFile(webPageResource));

app.get('/api/data', (req: Request, res: Response) => queryData(res));
app.get('/api/data/:sector', (req: Request, res: Response) => queryData(res, { sector: req.params.sector }));
app.get('/api/data/:sector/:type', (req: Request, res: Response) => queryData(res, { sector: req.params.sector, dataType: req.params.type }));

app.post('/api/data', (req: Request, res: Response) => {
    console.log(req.body);
    const data: Data = new Data(req.body);

    if (!data.isValid()) {
        console.log("Error. Data failed to parse.");
        res.sendStatus(400);
        return;
    }

    data.timeStamp = Date.now();
    readingsDb.insert(data, (err, doc) => {
        if (err)
            return;

        readingsDb.persistence.compactDatafile();
    });

    res.send(data).status(200);

    connectedClients.forEach(client => {
        client.emit("onNewData", JSON.stringify(data));
    });

    readingsDb.find({
        sector: data.sector,
        dataType: data.dataType
    }).sort({
        timeStamp: 1
    }).exec((err, docs) => {
        if (err || docs.length <= maxDataCount)
            return;

        readingsDb.remove(docs[0]);
        readingsDb.persistence.compactDatafile();
    });
});

const http = new httpModule.Server(app);
const io = new socketIo.Server(http, { cors: options });

io.on("connection", (socket: Socket) => {
    console.log("New client connected");
    connectedClients.push(socket);

    socket.on('disconnect', (reason: string) => {
        console.log(`Client disconnected. Reason ${reason}`);

        const index = connectedClients.indexOf(socket);
        if (index > -1)
            connectedClients.splice(index, 1);
    });

    const allData = JSON.stringify(readingsDb.getAllData());
    socket.emit("onNewConnection", allData);
});

const port = process.env.PORT || 3001;
const server = http.listen(port, () => console.log(`Server running on port ${port}...`));

io.listen(server);

// Helper function for quering and returning data.
function queryData(res: Response, query?: FilterQuery<Data>) {

    let transaction: Cursor<Data>;
    if (typeof query !== 'undefined')
        transaction = readingsDb.find(query);
    else
        transaction = readingsDb.find({});

    transaction.exec((err, document) => {
        if (err || document.length === 0) {
            res.sendStatus(404);
            return;
        }

        res.send(document).status(200);
    })
};