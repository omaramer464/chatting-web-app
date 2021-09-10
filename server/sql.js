const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
	db.run(`CREATE TABLE IF NOT EXISTS account (
		id VARCHAR,
		accessToken VARCHAR NOT NULL,
		username VARCHAR NOT NULL,
		password VARCHAR NOT NULL,
		email TEXT NOT NULL,
		firstName TEXT NOT NULL,
		lastName TEXT NOT NULL,
		friends VARCHAR NOT NULL,
		friendRequests VARCHAR NOT NULL,
		sentRequests VARCHAR NOT NULL,
		PRIMARY KEY(id)
		)`);

	db.run(`CREATE TABLE IF NOT EXISTS picture (
		id VARCHAR,
		img LONGTEXT NOT NULL)`);

	db.run(`CREATE TABLE IF NOT EXISTS chat (
		id VARCHAR NOT NULL,
		first VARCHAR NOT NULL,
		second VARCHAR NOT NULL,
		messages VARCHAR NOT NULL
		)`);
});