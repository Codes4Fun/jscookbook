var fs = require('fs');
var http = require('http');
var WebSocketServer = require('ws').Server;

var httpServer = http.createServer(function (request, response)
{
	var rs = fs.createReadStream('index.html');
	response.writeHead(200, {'Content-Type': 'text/html'});
	rs.on('data', function (chunk) {
		if(!response.write(chunk)){
			rs.pause();
		}
	});
	rs.on('end', function () {
		response.end();
	});
	response.on("drain", function () {
		rs.resume();
	});
});
httpServer.listen(80);

var connections = [];
var wsserver = new WebSocketServer({port: 8080});
wsserver.on('connection', function(ws)
{
	gws = ws;
	var localws = ws;
	var remoteAddress = ws._socket.remoteAddress;
	var remotePort = ws._socket.remotePort;
	
	console.log('new connection with %s:%d', remoteAddress, remotePort);
	connections.push(ws);
	
    ws.on('message', function(message)
    {
        console.log('received %s:%d > %s', remoteAddress, remotePort, message);
        for (var i = 0; i < connections.length; i++)
        {
			if (localws == connections[i]) continue;
			connections[i].send(message);
        }
    });
    
    ws.on('close', function()
    {
		console.log('closed connection with %s:%d', remoteAddress, remotePort);
		var index = connections.indexOf(localws);
		if (index > -1)
		{
			connections.splice(index, 1);
		}
    });
    
    ws.send('welcome');
});


