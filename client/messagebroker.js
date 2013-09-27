var MessageBroker = function() {

    var self = this;
    self.messageHandler = new MessageHandler();


    self.init = function() {
        console.log("MessageBroker started");
        self.ws = new WebSocket('ws://lierot-jvanhalen.rhcloud.com:8000');

        self.ws.onmessage = function (event) {
            var msg = JSON.parse(event.data);
            console.log(msg);
            self.messageHandler.receive(msg);
        };

        self.ws.onerror = function (event) {
            console.log("websocket failed");
        };
        
        self.ws.onopen = function (event) {
            console.log("websocket connected");
            };
        },
        
        self.send = function(data) {
            console.log("data:", data);
            self.ws.send(JSON.stringify(data)); // Käytä JSON.stringify serialisoimaan lähetettävä data
        }

    // Alusta websocket luonnin yhteydessä
    self.init();
}