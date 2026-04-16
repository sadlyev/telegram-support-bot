require("dotenv").config()

module.exports = {
client: "pg",
connection: {
connectionString: process.env.DATABASE_URL,
ssl: { rejectUnauthorized: false },
},
    migrations: { directory: './src/db/migrations' }
};
