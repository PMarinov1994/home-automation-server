import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import { queryData, importApiDataRequest } from './dataDbOperations';
import { ON_NEW_DATA_RECIEVED } from './RestAPIconsts';
import { clientsManager } from './types/client';

export const expressApplication: Application = express();

expressApplication.use(express.json());
expressApplication.use(express.urlencoded({ extended: true }));

expressApplication.use(express.static(path.join(__dirname, '../build')));
const webPageResource: string = path.join(__dirname, '../build', 'index.html');

// Return web pages
expressApplication.get('/', (req: Request, res: Response, next: NextFunction) => res.sendFile(webPageResource));
expressApplication.get('/living-room', (req: Request, res: Response, next: NextFunction) => res.sendFile(webPageResource));
expressApplication.get('/bed-room', (req: Request, res: Response, next: NextFunction) => res.sendFile(webPageResource));
expressApplication.get('/kids-room', (req: Request, res: Response, next: NextFunction) => res.sendFile(webPageResource));
expressApplication.get('/outside', (req: Request, res: Response, next: NextFunction) => res.sendFile(webPageResource));

// API GET data
expressApplication.get('/api/data', (req: Request, res: Response) => queryData(res));
expressApplication.get('/api/data/:sector', (req: Request, res: Response) => queryData(res, { sector: req.params.sector }));
expressApplication.get('/api/data/:sector/:type', (req: Request, res: Response) => queryData(res, { sector: req.params.sector, dataType: req.params.type }));

// API POST data
expressApplication.post('/api/data', (req: Request, res: Response) => {
    const data = importApiDataRequest(req.body);
    if (data === undefined) {
        console.log("Error. Data failed to parse.");
        res.sendStatus(400);
    } else {
        res.send(data).status(200);
        clientsManager.broadcastData(ON_NEW_DATA_RECIEVED, JSON.stringify(data));
    }
});