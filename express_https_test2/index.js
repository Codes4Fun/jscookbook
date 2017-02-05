var
	fs = require('fs'),
	https = require('https'),
	express = require('express'),
	app = express();

function getAll(req, res)
{
	console.log(req.protocol, ' GET /');
	if (req.protocol == 'https')
	{
		res.sendFile('index_https.html', {root:'./'});
		return;
	}
	res.sendFile('index_http.html', {root:'./'});
}

app.get('*', getAll);

app.listen(80, function () { console.log('listening 80'); });

https.createServer({
	key: fs.readFileSync('newkey.pem'),
	cert: fs.readFileSync('cert.pem')
}, app).listen(443, function () { console.log('listening 443'); });
