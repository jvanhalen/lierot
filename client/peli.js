var Peli = function () {
    var self = this;

    self.alusta = function() {
        self.messageBroker = new MessageBroker();
    }

    self.alusta();
}