const db = require('./db');
const http = require('http');
const fs = require('fs').promises;
const hostname = 'localhost';
const port = 3000;

async function getFile(file) {
	return await fs.readFile(file,'utf8');
}

function buildScript(html, map) {
	genders = new Set(map.map(item=>item.gender).filter(Boolean));
	languages = new Set(map.map(item=>item.language).filter(Boolean));
	string = "";
	for(let gender of genders) {
		for(let language of languages) {
			string += "function build_"+gender+"_"+language+"() {\n";
			string += map.filter(item=>item.gender == gender || item.gender == null).filter(item=>item.language == language || item.language == null).map(item=>"document.getElementById('"+item.element_id+"').innerHTML='"+item.string+"';").join("\n");
			string += "}\n";
		}
	}
	return html.replace("[[node_script]]",string);
}

const server = http.createServer(async (req, res) => {
	if(req.url == "/") url = "/index.html";
	else url = req.url;
	content = await db.getContent();
	try {
		html = await getFile(__dirname + url);
		html = buildScript(html,content);
		res.writeHead(200);
		res.end(html);
	} catch {
		res.writeHead(404);
		return;
	}
}).listen(port);
