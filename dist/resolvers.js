import client from "./pg.js";
const resolvers = {
    Query: {
        async games() {
            const res = await client.query("SELECT * FROM games;");
            return res.rows;
        },
        async game(_, args) {
            const res = await client.query("SELECT * FROM games WHERE id = $1", [args.id]);
            return res.rows[0];
        },
        async authors() {
            const res = await client.query("SELECT * FROM authors;");
            return res.rows;
        },
        async author(_, args) {
            const res = await client.query("SELECT * FROM authors WHERE id = $1", [args.id]);
            return res.rows[0];
        },
        async reviews() {
            const res = await client.query("SELECT * FROM reviews");
            return res.rows;
        },
        async review(_, args) {
            const res = await client.query("SELECT * FROM reviews WHERE id = $1", [args.id]);
            return res.rows[0];
        },
    },
    Game: {
        async reviews(parent) {
            const res = await client.query("SELECT * FROM reviews WHERE game_id = $1", [parent.id]);
            return res.rows;
        },
    },
    Author: {
        async reviews(parent) {
            const res = await client.query("SELECT * FROM reviews WHERE author_id = $1", [
                parent.id,
            ]);
            return res.rows;
        },
    },
    Review: {
        async author(parent) {
            const res = await client.query("SELECT * FROM authors WHERE id = $1", [
                parent.author_id,
            ]);
            return res.rows[0];
        },
        async game(parent) {
            const res = await client.query("SELECT * FROM games WHERE id = $1", [parent.game_id]);
            return res.rows[0];
        },
    },
    Mutation: {
        async deleteGame(_, args) {
            await client.query("DELETE FROM reviews WHERE game_id = $1", [args.id]);
            await client.query("DELETE FROM games WHERE id = $1", [args.id]);
            const tableQuery = await client.query("SELECT * FROM games;");
            return {
                message: "Game deleted successfully",
                result: tableQuery.rows,
            };
        },
        async addGame(_, args) {
            const res = await client.query("INSERT INTO games (title, platform) VALUES ($1, $2) RETURNING *", [args.game.title, args.game.platform]);
            return res.rows[0];
        },
        async updateGame(_, { id, edits }) {
            // Ensure at least one field is provided in the edits object
            if (!edits ||
                (edits.title === null && (!edits.platform || edits.platform.length === 0))) {
                throw new Error("At least one field (title or platform) must be provided.");
            }
            // Dynamically build the fields to update based on what was provided
            const updateFields = {};
            if (edits.title !== undefined)
                updateFields.title = edits.title;
            if (edits.platform !== undefined)
                updateFields.platform = edits.platform;
            const currentGame = await client.query(`SELECT title FROM games WHERE id = $1`, [id]);
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
                    updateFields.title || currentGame.rows[0].title,
                    updateFields.platform ? `{${updateFields.platform.join(",")}}` : null,
                    id,
                ]);
                return updatedGame.rows[0];
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error(error.message);
                }
            }
        },
    },
};
export default resolvers;
