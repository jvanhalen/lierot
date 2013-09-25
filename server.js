var MessageBroker = require('./server/messagebroker');
var MessageHandler = require('./server/messagehandler');
var DatabaseProxy = require('./server/databaseproxy');

var Server = function() {

  console.log("asdf");
  // Määrittele scope
  var self = this;

  self.setupVariables = function() {
    self.ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
    self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

    if (typeof self.ipaddress === "undefined") {
      //code
      console.log("all env variables not defined, using IP 127.0.0.1");
      self.ipaddress = "127.0.0.1";
      self.port = 8080;
    }
  },

  self.init = function() {
    console.log("Server initializing...")

    self.setupVariables();

    var http = require('http'),
     express = require('express');
    self.app = express();

    // Salli hakemistot
    self.app.use('/client', express.static(__dirname + '/client'));
    self.app.use('/common', express.static(__dirname + '/common'));

    self.app.get('/', function(req, res) {
    res.sendfile('./index.html');
    });

    self.server = http.createServer(self.app);
    self.server.listen(self.port, self.ipaddress);
    console.log("server:", self.ipaddress, ":", self.port);

    // Luo MessageBroker
    self.messageBroker = new MessageBroker(self.server);
    self.databaseProxy = new DatabaseProxy();

    // Alusta MessageBroker
    self.messageBroker.init();
    // Alusta DatabaseProxy
    self.databaseProxy.init();

  }
}

var server = new Server();
server.init();