const { Client } = require('pg');
const client = new Client();
client.connect();

async function getContent() {
	content = await client.query('SELECT * from content ORDER BY page, element_id');
	return content;
}

async function updateContent(obj) {
	update = "UPDATE content SET page='"+obj.page+"',element_id='"+obj.element_id+"',gender='"+obj.gender+"',language='"+obj.language+"',string='"+obj.string+"',depth="+obj.depth+" WHERE content_id='"+obj.content_id+"';";
	update = update.replace("'NULL'","null");
	await client.query(update);
}

async function createContent(obj) {
	insert = "INSERT INTO content(page,element_id,gender,language,string,depth) values('"+obj.page+"','"+obj.element_id+"','"+obj.gender+"','"+obj.language+"','"+obj.string+"',"+obj.depth+");";
	insert = insert.replace("'NULL'","null");
	await client.query(insert);
}

module.exports = { getContent,createContent,updateContent };
