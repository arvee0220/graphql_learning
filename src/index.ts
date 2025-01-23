import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs } from "./schema.js";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import resolvers from "./resolvers.js";

// type annotations
interface MyContext {
	token?: string;
}

// server setup
const PORT = 4000;

// express
const app = express();

const server = new ApolloServer<MyContext>({
	// typeDefs -- definitions of types of data author
	typeDefs,

	// resolvers -- contains queries and mutations
	resolvers,
});

async function startServer() {
	await server.start();

	app.use(
		"/",
		cors(),
		bodyParser.json(),
		expressMiddleware(server, {
			context: async ({ req }) => ({ token: req.headers.authorization }),
		}) as any
	);

	const PORT = 4000;
	app.listen(PORT, () => {
		console.log(`Server is running on http://localhost:${PORT}/graphql`);
	});
}

startServer().catch((error) => {
	console.error("Failed to start server:", error);
});
