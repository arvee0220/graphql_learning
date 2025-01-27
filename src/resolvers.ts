import client from "./pg.js";

interface Args {
	id: string;
}

interface AddGameArgs {
	game: { title: string; platform: string[] };
}

interface UpdateGameArgs {
	id: string;
	edits: { title: string; platform: string[] };
}

interface EditGameInput {
	title: string;
	platform: string[];
}

interface Game {
	id: string;
	title: string;
	platform: string[];
	reviews: Review[];
}

interface Review {
	id: string;
	rating: number;
	content: string;
	game_id: string;
	author_id: string;
}

interface Author {
	id: string;
	name: string;
	verified: boolean;
	reviews: Review[];
}

const resolvers = {
	Query: {
		async games() {
			const res = await client.query("SELECT * FROM games;");

			return res.rows;
		},

		async game(_: unknown, args: Args) {
			const res = await client.query("SELECT * FROM games WHERE id = $1", [args.id]);

			return res.rows[0];
		},

		async authors() {
			const res = await client.query("SELECT * FROM authors;");

			return res.rows;
		},

		async author(_: unknown, args: Args) {
			const res = await client.query("SELECT * FROM authors WHERE id = $1", [args.id]);

			return res.rows[0];
		},

		async reviews() {
			const res = await client.query("SELECT * FROM reviews");

			return res.rows;
		},

		async review(_: unknown, args: Args) {
			const res = await client.query("SELECT * FROM reviews WHERE id = $1", [args.id]);

			return res.rows[0];
		},
	},
	Game: {
		async reviews(parent: Game) {
			const res = await client.query("SELECT * FROM reviews WHERE game_id = $1", [parent.id]);

			return res.rows;
		},
	},
	Author: {
		async reviews(parent: Author) {
			const res = await client.query("SELECT * FROM reviews WHERE author_id = $1", [
				parent.id,
			]);

			return res.rows;
		},
	},
	Review: {
		async author(parent: Review) {
			const res = await client.query("SELECT * FROM authors WHERE id = $1", [
				parent.author_id,
			]);

			return res.rows[0];
		},

		async game(parent: Review) {
			const res = await client.query("SELECT * FROM games WHERE id = $1", [parent.game_id]);

			return res.rows[0];
		},
	},
	Mutation: {
		async deleteGame(_: unknown, args: Args) {
			await client.query("DELETE FROM reviews WHERE game_id = $1", [args.id]);

			await client.query("DELETE FROM games WHERE id = $1", [args.id]);

			const tableQuery = await client.query("SELECT * FROM games;");

			return {
				message: "Game deleted successfully",
				result: tableQuery.rows,
			};
		},

		async addGame(_: unknown, args: AddGameArgs) {
			const res = await client.query(
				"INSERT INTO games (title, platform) VALUES ($1, $2) RETURNING *",
				[args.game.title, args.game.platform]
			);

			return res.rows[0];
		},

		async updateGame(_: unknown, { id, edits }: { id: string; edits: EditGameInput }) {
			// Ensure at least one field is provided in the edits object
			if (
				!edits ||
				(edits.title === null && (!edits.platform || edits.platform.length === 0))
			) {
				throw new Error("At least one field (title or platform) must be provided.");
			}

			// Dynamically build the fields to update based on what was provided
			const updateFields: Partial<EditGameInput> = {};
			if (edits.title !== undefined) updateFields.title = edits.title;
			if (edits.platform !== undefined) updateFields.platform = edits.platform;

			const currentGame = await client.query(`SELECT title FROM games WHERE id = $1`, [id]);
			const currentGamePlatform = await client.query(
				`SELECT platform FROM games WHERE id = $1`,
				[id]
			);

			try {
				const updateQuery = `
				UPDATE games 
				SET 
				  title = COALESCE($1, (SELECT title FROM games WHERE id = $3)),
				  platform = $2
				WHERE id = $3 
				RETURNING *;
			  `;

				const updatedGame = await client.query(updateQuery, [
					updateFields.title || currentGame.rows[0].title, // $1
					updateFields.platform
						? `{${updateFields.platform.join(",")}}`
						: currentGamePlatform.rows[0].platform, // $2
					id, // $3
				]);

				return updatedGame.rows[0];
			} catch (error) {
				if (error instanceof Error) {
					throw new Error(error.message);
				}
			}
		},
	},
};

export default resolvers;
