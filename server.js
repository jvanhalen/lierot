var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

var WebSocketServer = require('ws').Server
  , http = require('http')
  , express = require('express')
  , app = express();

app.use('/javascript', express.static(__dirname + '/javascript'));
app.get('/', function(req, res) {
/*require('fs').readFile(__dirname + '/index.html', 'utf8', function(err, text){
        res.send(text);
    });*/
    res.sendfile('index.html');
});

var server = http.createServer(app);
server.listen(port, ipaddress);
console.log("server:", ipaddress, ":", port);

var wss = new WebSocketServer({server: server});
wss.on('connection', function(ws) {
  var id = setInterval(function() {
    ws.send('ping pong', function() { /* ignore errors */ });
  }, 1000);
  console.log('started client interval');
  ws.on('close', function() {
    console.log('stopping client interval');
    clearInterval(id);
  });
});

