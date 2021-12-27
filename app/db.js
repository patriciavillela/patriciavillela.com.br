const { Client } = require('pg');
const client = new Client();
client.connect();

async function getContent() {
	content = await client.query('SELECT * from content');
	return content.rows;
}

module.exports = { getContent };
