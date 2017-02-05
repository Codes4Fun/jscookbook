var fs = require('fs');
var https = require('https');
var http = require('http');

var secureServer = https.createServer({
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem'),
}, function (request, response) {
	response.writeHead(200, {"Content-Type": "text/plain"});
	response.end("Hello World\n");
});

var server = http.createServer(function (request, response) {
	response.writeHead(302, {
		'Location': 'https://' + request.headers.host + request.url
	});
	response.end();
});

secureServer.listen(443);
server.listen(80);
