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
	table += "<th>page</th><th>element_id</th><th>gender</th><th>language</th><th>string</th><th>password</th><th>content_id</th>";
	table += "</tr>";
	rows = content.rows;
	table += rows.map(row => "<form action='/edit' method='post'><tr><td><input id='page' name='page' value='"+row.page+"'></td><td><input id='element_id' name='element_id' value='"+row.element_id+"'></td><td><input id='gender' name='gender' value='"+row.gender+"'></td><td><input id='language' name='language' value='"+row.language+"'></td><td><textarea id='string' name='string'>"+row.string.replaceAll("<","&lt;").replaceAll(">","&gt;")+"</textarea></td><td><input name='password' id='password' name='password'></td><td><input id='content_id' name='content_id' value='"+row.content_id+"'></td><td><input type='submit' value='Save'></td></tr></form>").join("").replaceAll("value='null'","value='NULL'");
	return html.replace('[[table]]',table);
}

function buildObjectFromData(data) {
	data = data.split("&");
	obj = {};
	obj.page = data[0].split("=")[1];
	obj.element_id = data[1].split("=")[1];
	obj.gender = data[2].split("=")[1];
	obj.language = data[3].split("=")[1];
	obj.string = decodeURIComponent(data[4].split("=")[1]).replaceAll("+"," ");
	obj.password = data[5].split("=")[1];
	if(data[7]) obj.content_id = data[6].split("=")[1];
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

function buildOrderedScript(map) {
	string = "";
	console.log(string);
	new Set(map.map(item=>item.gender).filter(Boolean)).forEach(function(gender) {
		new Set(map.map(item=>item.language).filter(Boolean)).forEach(function(language) {
			filteredMap = map.filter(item=>(item.gender==gender||item.gender==null)&&(item.language==language||item.language==null));
			filteredMap.forEach(function(item) {
				if(!item.depth) item.depth = 0;
				matches = item.string.match(/(?<=id=\")\w+/g);
				if(matches) matches.forEach(function(id) {
					filteredMap.filter(row=>row.element_id==id)[0].depth = item.depth + 1;	
				});
			});
			orderedFilteredMap = filteredMap.sort((a,b)=>a.depth-b.depth);
			string += "function build_"+gender+"_"+language+"(){\n"+orderedFilteredMap.map(row=>"if(document.getElementById('"+row.element_id+"')) document.getElementById('"+row.element_id+"').innerHTML='"+row.string+"';").join("\n")+"\n}\n";
		});
	});
	return string;
}


const server = http.createServer(async (req, res) => {
	if(req.url == "/") url = "/index.html";
	else url = req.url;
	content = await db.getContent(url);
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
				html = html.replace("[[node_script]]",buildOrderedScript(content.rows));
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
