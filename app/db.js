const { Client } = require('pg');
const client = new Client();
client.connect();

async function getContent() {
	content = await client.query('SELECT * from content');
	return content;
}

async function createContent(obj) {
	insert = "INSERT INTO content(page,element_id,gender,language,string,depth) values('"+obj.page+"','"+obj.element_id+"','"+obj.gender+"','"+obj.language+"','"+obj.string+"',"+obj.depth+");";
	insert = insert.replace("'NULL'","null");
	console.log(insert);
	await client.query(insert);
}

module.exports = { getContent,createContent };
