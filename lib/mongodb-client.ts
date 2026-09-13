import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
export default client.connect(); // Auth.js adapter expects a Promise<MongoClient>
