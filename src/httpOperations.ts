import { expressApplication } from "./expressOperations";
import httpModule from 'http';

export const httpServer = new httpModule.Server(expressApplication);