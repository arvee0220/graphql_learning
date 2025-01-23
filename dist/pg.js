import pkg from "pg";
import dotenv from "dotenv";
const { Client } = pkg;
dotenv.config();
const client = new Client({
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT),
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
});
const connectToDatabase = async () => {
    try {
        await client.connect();
        console.log(`Host: ${process.env.PG_HOST}`);
        console.log(`Database: ${process.env.PG_DATABASE}`);
        console.log(`User: ${process.env.PG_USER}`);
        console.log("Connected to PostgreSQL!");
    }
    catch (err) {
        console.error("Error connecting to PostgreSQL:", err);
    }
};
connectToDatabase();
export default client;
