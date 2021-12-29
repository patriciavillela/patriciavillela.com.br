const db = require('./db');
const http = require('http');
const fs = require('fs').promises;
const hostname = 'localhost';
const port = 3000;
const password = process.env.PASSWORD;

async function getFile(file) {
	return await fs.readFile(file,'utf8');
}

async function buildAdmin(html, content) {
	table = "<table><tr>";
	fields = content.fields.map(field=>field.name);
	table += fields.map(field => "<th>"+field+"</th>").join("");
	table += "</tr>";
	rows = content.rows;
	table += rows.map(row => "<tr><td>"+row.content_id+"</td><td>"+row.page+"</td><td>"+row.element_id+"</td><td>"+row.gender+"</td><td>"+row.language+"</td><td>"+row.string.replaceAll("<","&lt;").replaceAll(">","&gt;")+"</td><td>"+row.depth+"</td></tr>").join("");
	return html.replace('[[table]]',table);
}

function persist(data) {
	data = data.split("&");
	if(data[6].split("=")[1] != password) return;
	obj = {};
	obj.page = data[0].split("=")[1];
	obj.element_id = data[1].split("=")[1];
	obj.gender = data[2].split("=")[1];
	obj.language = data[3].split("=")[1];
	obj.string = data[5].split("=")[1];
	obj.depth = data[4].split("=")[1];
	db.createContent(obj);
}

function buildScript(html, map) {
	deepest = map.map(row=>row.depth).reduce((largest,current)=>largest>current?largest:current);
	sortedMap = map.sort((a,b)=>a.depth-b.depth);
	genders = new Set(map.map(item=>item.gender).filter(Boolean));
	languages = new Set(map.map(item=>item.language).filter(Boolean));
	string = "";
	for(let gender of genders) {
		for(let language of languages) {
			string += "function build_"+gender+"_"+language+"() {\n";
			string += map.filter(item=>item.gender == gender || item.gender == null).filter(item=>item.language == language || item.language == null).map(item=>"if(document.getElementById('"+item.element_id+"')) document.getElementById('"+item.element_id+"').innerHTML='"+item.string+"';").join("\n");
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
		if(url == "/save") {
			let body = '';
			req.on('data',buffer=>{body+=buffer.toString();});
			req.on('end',()=>{
				persist(body);
				res.end("ok")
			});
		} else {
			html = await getFile(__dirname + url);
			if(url == "/index.html")
				html = buildScript(html,content.rows);
			else if(url == "/admin.html")
				html = await buildAdmin(html,content);
			else if(url == "/save")
				html = "SAVE";
		}
		res.writeHead(200);
		res.end(html);
	} catch {
		res.writeHead(404);
		return;
	}
}).listen(port);
