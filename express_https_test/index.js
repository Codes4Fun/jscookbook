var fs = require('fs');
var express = require('express');

require('https').createServer({
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem'),
}, express().get('*',function (req, res) {
	res.send('hello world')
})).listen(443);

express().get('*',function (req, res) {
	res.redirect('https://' + req.hostname + req.originalUrl);
}).listen(80)
