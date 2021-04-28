import { socketIoServer } from './socketOperations';
import { httpServer } from './httpOperations';

const port = 2052;
const server = httpServer.listen(port, () => console.log(`Server running on port ${port}...`));
socketIoServer.listen(server);