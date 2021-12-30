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
	table += "<th>page</th><th>element_id</th><th>gender</th><th>language</th><th>depth</th><th>string</th><th>password</th><th>content_id</th>";
	table += "</tr>";
	rows = content.rows;
	table += rows.map(row => "<form action='/edit' method='post'><tr><td><input id='page' name='page' value='"+row.page+"'></td><td><input id='element_id' name='element_id' value='"+row.element_id+"'></td><td><input id='gender' name='gender' value='"+row.gender+"'></td><td><input id='language' name='language' value='"+row.language+"'></td><td><input id='depth' name='depth' value='"+row.depth+"'></td><td><textarea id='string' name='string'>"+row.string.replaceAll("<","&lt;").replaceAll(">","&gt;")+"</textarea></td><td><input name='password' id='password' name='password'></td><td><input id='content_id' name='content_id' value='"+row.content_id+"'></td><td><input type='submit' value='Save'></td></tr></form>").join("").replaceAll("value='null'","value='NULL'");
	return html.replace('[[table]]',table);
}

function buildObjectFromData(data) {
	data = data.split("&");
	obj = {};
	obj.page = data[0].split("=")[1];
	obj.element_id = data[1].split("=")[1];
	obj.gender = data[2].split("=")[1];
	obj.language = data[3].split("=")[1];
	obj.string = decodeURIComponent(data[5].split("=")[1]).replaceAll("+"," ");
	obj.depth = data[4].split("=")[1];
	obj.password = data[6].split("=")[1];
	if(data[7]) obj.content_id = data[7].split("=")[1];
	return obj;
}

function update(data) {
	obj = buildObjectFromData(data);
	if(obj.password != password) return;
	db.updateContent(obj);
}

function persist(data) {
	obj = buildObjectFromData(data);
	if(obj.password != password) return;
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
			res.writeHead(301, {Location:'/admin.html'});
			res.end();
		} else if(url == "/edit") {
			let body = '';
			req.on('data',buffer=>{body+=buffer.toString();});
			req.on('end',()=>{
				update(body);
				res.end("ok")
			});
			res.writeHead(301, {Location:'/admin.html'});
			res.end();
		} else {
			html = await getFile(__dirname + url);
			if(url == "/index.html")
				html = buildScript(html,content.rows);
			else if(url == "/admin.html")
				html = await buildAdmin(html,content);
			else if(url == "/save")
				html = "SAVE";
			res.writeHead(200);
			res.end(html);
		}
	} catch {
		res.writeHead(404);
		return;
	}
}).listen(port);
