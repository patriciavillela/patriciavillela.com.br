const { Client } = require('pg');
const client = new Client({
	user: 'website',
	host: 'localhost',
	database: 'patrickvob.com.br',
	password: '123456',
	port: 5432
});
client.connect();

async function getContent() {
	content = await client.query('SELECT * from content');
	return content.rows;
}

module.exports = { getContent };
