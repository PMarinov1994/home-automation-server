import { Response } from 'express';
import Nedb, { FilterQuery, Cursor } from "nedb";
import { ON_NEW_DATA_RECIEVED } from './RestAPIconsts';
import { clientsManager } from './types/client';
import { Data } from "./types/data";

const maxDataCount: number = 500;
const readingsDb: Nedb<Data> = new Nedb<Data>({
    filename: "db",
    autoload: true,
});

export function addRecord(data: Data) {
    readingsDb.insert(data, (err, doc) => {
        if (err)
            return;

        readingsDb.persistence.compactDatafile();
    });
}

export function getAllRecords(): Data[] {
    return readingsDb.getAllData();
}

export function reduceDbSize(data: Data) {
    readingsDb.find({ sector: data.sector, dataType: data.dataType }).sort({ timeStamp: 1 }).exec((err, docs) => {
        if (err || docs.length <= maxDataCount)
            return;

        readingsDb.remove(docs[0]);
        readingsDb.persistence.compactDatafile();
    });
}

// Helper function for quering and returning data.
export function queryData(res: Response, query?: FilterQuery<Data>) {

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

export function importApiDataRequest(dataRequest: string): Data | undefined {
    const data: Data = new Data(dataRequest);

    if (!data.isValid()) {
        return undefined;
    }

    data.timeStamp = Date.now();
    addRecord(data);
    reduceDbSize(data);

    return data;
}