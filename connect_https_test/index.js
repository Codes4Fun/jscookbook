var connect = require('connect');

require('https').createServer({
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem'),
}, connect().use(function (req, res) {
	res.end('hello world')
})).listen(443);

connect().use(function (req, res) {
	res.writeHead(302, {
  		'Location': 'https://' + req.hostname + req.path
	});
	res.end();
}).listen(80)
