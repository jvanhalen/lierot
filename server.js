var MessageBroker = require('./server/messagebroker');
var MessageHandler = require('./server/messagehandler');
var DatabaseProxy = require('./server/databaseproxy');



var Server = function() {
    
    //  Määrittele scope
    var self = this;
    
    self.setupVariables = function() {
        //  Set the environment variables we need for OpenShift app
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };
    
    self.init = function() {

        console.log("Server: initializing...");
        
        var http = require('http')
        , express = require('express');
        self.app = express();
        
        // Salli hakemistot
        self.app.use('/client', express.static(__dirname + '/client'));
        self.app.use('/common', express.static(__dirname + '/common'));

        // Palauta index.html selaimille
        self.app.get('/', function(req, res) {
            console.log("loading index.html");
            res.sendfile('index.html');
        });
        
        self.server = http.createServer(self.app);
        self.server.listen(self.port, self.ipaddress);
        console.log("created server @ ", self.ipaddress, ":", self.port);
    
        // Luo palvelinoliot
        self.messageBroker = new MessageBroker(self.server);
        self.messageHandler = new MessageHandler();
        self.databaseProxy = new DatabaseProxy();
        
        // Kytke oliot toisiinsa (molempiin suuntiin):
        // MessageBroker -> MessageHandler -> DatabaseProxy
        self.messageBroker.attachHandler(self.messageHandler);        
        self.messageHandler.attachDatabaseProxy(self.databaseProxy);
        
        // DatabaseProxy -> MessageHandler -> MessageBroker        
        self.databaseProxy.attachHandler(self.messageHandler);
        self.messageHandler.attachBroker(self.messageBroker);
        
        console.log("server started");
    }

    // Aseta palvelimen sisäiset muuttujat
    self.setupVariables();
    
    // Alusta ja käynnistä palvelin luotaessa
    self.init();
}

// Luo palvelininstanssi
var server = new Server("server");

