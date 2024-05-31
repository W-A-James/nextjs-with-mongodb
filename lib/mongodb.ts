import { MongoClient } from "mongodb";
import { inspect } from "util";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

function attachListeners(client: MongoClient) {
  const events = [
    'serverHeartbeatFailed',
    'serverHeartbeatStarted',
    'serverHeartbeatSucceeded',
    'topologyDescriptionChanged',
    'serverDescriptionChanged',

    'connectionReady',
    'connectionCheckedOut',
    'connectionCheckOutStarted',
    'connectionCheckOutFailed',
    'connectionCheckedIn',
    'connectionClosed',
    'connectionCreated',

    'connectionPoolClosed',
    'connectionPoolCleared',
    'connectionPoolReady',
    'connectionPoolCreated'
  ];

  for (const event of events) client.on(event, ev => {
    console.log(inspect(ev, { depth: 100 }));
  });
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    attachListeners(client);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  attachListeners(client);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
