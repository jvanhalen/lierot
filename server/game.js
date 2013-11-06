var messages = require('../common/messages');

var worm = function(name, number) {
    var color = ["blue", "green", "orange", "brown"];
    var self = this;
    self.alive = true; // true / false
    self.name = name;
    self.color = color[number]; // Pick a color for the worm
    self.startingLength = 5;
    self.length = self.startingLength;
    self.location = [];
    self.direction = "right";   // Direction: right, left, up, down
    self.newDirection = "right";
    self.velocity = 1;
    self.score = 0;

    // Initialize worm
    for(var x=0; x<self.startingLength; x++) {
        self.location[x] = x+number*8*40;
    }

    console.log("worm", name, "location:", self.location);
}

var food = function(location){
    var self = this;
    self.location = location;
    self.color = "red";
    self.growth = Math.floor(Math.random()*1+1); // Growth per food
}

var gameArea = function() {
    var self = this;
    self.cells = [];
    self.height = 40;
    self.width = 40;
    self.color = "lightblue";   // Game area color
}

// Game server
var GameServer = function(messagehandler) {

    var self = this;
    self.systemtimer = 0;
    self.messageHandler = messagehandler;
    self.messageHandler.attachGameServer(self);
    self.gameSessions = {};

    self.matchQueue = {};
    self.matchQueueTmo = 8000;

    self.queueMatch = function(from, data) {
        console.log("queue match", data);
        // TODO: better matchmaking for multiplayer games
        if (undefined !== self.gameSessions[data.username]) {
            // Already in game, do we have to respond something?
        }
        else {
            if (undefined === self.matchQueue[data.username]) {
                self.matchQueue[data.username] = {playerList: [data.username], queueTimer: null};
            }
            self.createGame(data.username);
        }
    },

    self.createGame = function(challenger) {
        console.log("GameServer: create game for", challenger);
        console.log(self.matchQueue[challenger].playerList);

        var game = new Peli(self.matchQueue[challenger].playerList, self.messageHandler, self);
        // Connect players to the game
        for (var x=0; x<self.matchQueue[challenger].playerList.length; x++) {
            self.gameSessions[self.matchQueue[challenger].playerList[x]] = {player: self.matchQueue[challenger].playerList[x], game: game};
        }
        self.updatePlayerList(self.matchQueue[challenger].playerList, true);
    },

    self.endGame = function(playerList) {
        console.log("GameServer.endGame");
                           
        delete self.matchQueue[playerList[0]];
        var game = playerList[0].game;
        for (var x=0; x<playerList.length; x++) {
            delete self.gameSessions[playerList[x]];
        }
        self.updatePlayerList(playerList, "update");
    },

    self.updatePlayerList = function(playerList, status) {
        console.log("GameServer: updatePlayerList", playerList, status);
        var msg = messages.message.PLAYER_LIST.new();
        msg.type = "update";
        for(var item in playerList) {
            msg.players[item] = {username: playerList[item],
                                 ingame: self.isIngame(playerList[item]),
                                 authenticated: self.messageHandler.messageBroker.isConnected(playerList[item]),
                                 rank: 0};
        }
        self.messageHandler.broadcast(msg);
    },

    self.userData = function(from, msg) {
        switch (msg.name) {
            case 'DISCONNECT_REQ':
                console.log("GameServer: DISCONNECT_REQ from", msg.username);
                if (undefined !== self.gameSessions[msg.username]) {
                    self.gameSessions[msg.username].game.disconnect(msg);
                }
                break;

            case 'USER_INPUT':
                //console.log("USER_INPUT from", msg.username);
                if (undefined !== self.gameSessions[msg.username]) {
                    self.gameSessions[msg.username].game.userInput(msg);
                }
                break;
            default:
                console.log("default branch reached at GameServer.userData", msg);
                break;
        }
    },

    self.isIngame = function(username) {
        if (undefined === username || null == username) {
            console.log("isIngame() failed, username:", username);
        }
        if (self.gameSessions[username]) {
            console.log("isIngame: true for", username);
            return true;
        }
        console.log("isIngame: false for", username);
        return false;
    }

    self.systemTimer = function() {

    },

    self.handleChallengeRequest = function(from, msg) {
        console.log("GameServer: handleChallengeRequest");
        if (false == self.isIngame(msg.challenger) && false == self.isIngame(msg.challengee)) {
            console.log("sending CHALLENGE_REQ from", msg.challenger, "to", msg.challengee);
            self.messageHandler.send(msg.challengee, msg);
        }
    },

    self.handleChallengeResponse = function(from, msg) {
        console.log("GameServer: handleChallengeResponse");
        // TODO: message paramters
        if (typeof challenger === undefined || typeof challengee === undefined) {
            console.error("GameServer: handleChallengeResponse failed: typeof challengee/challenger === undefined");
        }
        if ("OK" == msg.response) {
            console.log("msg", msg);
            if (false == self.isIngame(msg.challenger) && false == self.isIngame(msg.challengee)) {
                if (undefined === self.matchQueue[msg.challenger]) {
                    console.log("adding challenger to queue", msg.challenger);
                    self.matchQueue[msg.challenger] = {playerList: [msg.challenger], queueTimer: null};
                }
                if (self.matchQueue[msg.challenger].playerList.length < 4) {
                    console.log("check that player has not yet joined", msg.challenger)
                    // Check that challengee hasn't already joined
                    var exists = false;
                    for(var item in self.matchQueue[msg.challenger].playerList) {
                        if (self.matchQueue[msg.challenger].playerList[item].toLowerCase() == msg.challengee.toLowerCase()) {
                            console.log("exists", msg.challengee)
                            exists = true;
                        }
                        else {
                            console.log("did not match", self.matchQueue[msg.challenger].playerList[item].toLowerCase(), msg.challengee.toLowerCase())
                        }
                    }
                    if (false == exists) {
                        console.log("pushing challengee", msg.challengee, self.matchQueue[msg.challenger]);
                        self.matchQueue[msg.challenger].playerList.push(msg.challengee);
                    }
                }
                if (self.matchQueue[msg.challenger].playerList.length >= 2 && null == self.matchQueue[msg.challenger].queueTimer) {
                    console.log("queueTmo set for"), msg.challenger;
                    self.matchQueue[msg.challenger].queueTimer = setTimeout(self.createGame, 6000, msg.challenger);
                }
            }
            else {
                console.log("could not find player:", msg.challenger, "or", msg.challengee);
            }
        }
    }

    var timer = setInterval(self.systemTimer, 1000);
}

var Peli = function(playerList, messageHandler, gameServer) {

    var self = this;

    self.tick = 160;    // 140-180 seems to be optimal

    self.messageHandler = messageHandler;
    self.gameServer = gameServer;

    self.timer = 0;
    self.amountOfFood = 8;
    self.gameArea = null;
    self.worms = [];
    self.foods = [];
    self.sessionId = 1;
    self.playerList = playerList;

    self.init = function() {
        console.log("creating new game for", self.playerList.length, "players.");

        self.gameArea = new gameArea();
        for (var x=0; x<self.playerList.length; x++) {
            self.worms.push(new worm(self.playerList[x], x));
        }
        self.initGameboard();
        self.setWorms();
        self.setFood();

        var msg = messages.message.MATCH_SYNC.new();
        msg.phase = "INIT";
        msg.msgid = 101;

        msg.worms = self.worms;
        msg.food = self.foods;

        self.syncPlayers(msg);

        self.timer = setInterval(self.updateMatch, self.tick);
    },

    self.initGameboard = function() {
        //console.log("initGameboard");
        for(var i=0; i<self.gameArea.height*self.gameArea.width; i++) {
            self.gameArea.cells[i] = self.gameArea.color;
        }
    },

    self.setWorms = function() {
        // Set worms to initial locations
        for (var i=0; i<self.worms.length; i++) {
            for(var x=0; x<self.worms[i].startingLength; x++) {
                self.gameArea.cells[self.worms[i].location[x]] = self.worms[i].color;
            }
        }
    },

    self.setFood = function() {
        //console.log("setFood");
        var i = 0;

        while(self.foods.length < self.amountOfFood) {
            var x = Math.floor(Math.random()*self.gameArea.height*self.gameArea.width);

            if (self.gameArea.cells[x] == self.gameArea.color) {
                var newFood = new food(x);
                self.foods.push(newFood);
                self.gameArea.cells[x] = newFood.color;
            }
        }
    },

    self.removeFood = function(location) {
        for (var x=0;x<self.foods.length; x++) {
            if (self.foods[x].location == location) {
                self.foods.splice(x, 1);
            }
        }
        self.setFood();

    },

    self.syncPlayers = function(msg) {
        //console.log("Peli.syncPlayers", msg);
        for (var x=0; x<self.playerList.length; x++) {
            self.messageHandler.send(self.playerList[x], msg);
        }
    },

    self.userInput = function(msg) {
        // TODO: check user input validity
        // TODO: Route msg to user specific match
        for (var x=0; x<self.worms.length; x++) {
            //console.log("handling worm", x);
            if (self.worms[x].name == msg.username) {
                switch (msg.direction) {
                    case "up":
                    case "left":
                    case "down":
                    case "right":
                        self.worms[x].newDirection = msg.direction;
                        break;
                    default:
                        console.log("invalid worm direction input:", self.worms[x].direction);
                        break;
                }
            }
        }
    },

    self.disconnect = function(data) {
        console.log("disconnect", data);
        for (var x=0; x<self.worms.length; x++) {
            if (self.worms[x].name == data.username) {
                self.worms[x].alive = false;
                break;
            }
        }
        // Update clients
    },

    self.endGame = function() {
        // TODO: lopeta game
        console.log("Game: endGame");
        clearInterval(self.timer);

        // Update possible highscores
        // TODO: direct access to databaseproxy
        for(var item in self.worms) {
            var username = self.worms[item].name;
            var score = self.worms[item].score;
            self.messageHandler.databaseProxy.setHighScore(username, score);            
        }

        self.gameServer.endGame(self.playerList);
    },


    self.updateMatch = function() {
        //console.log("updateMatch");

        // Käy läpi kaikki pelissä olevat worms (huom! matojen päivitysjärjestyksellä on merkitystä mm. törmäystarkistuksissa)
        for (var x=0; x<self.worms.length; x++) {
            var input = 0;
            var muutos = 0;
            // Siirrä vain alive olevia matoja
            if(self.worms[x].alive == true)
            {
                // Check for movement
                switch (self.worms[x].newDirection) {
                    case "up":
                        if (self.worms[x].direction != "down") {
                            self.worms[x].direction = "up";
                        }
                        break;

                    case "left":
                        if (self.worms[x].direction != "right") {
                            self.worms[x].direction = "left";
                        }
                        break;

                    case "down":
                        if (self.worms[x].direction != "up") {
                            self.worms[x].direction = "down";
                        }
                        break;

                    case "right":
                        if (self.worms[x].direction != "left") {
                            self.worms[x].direction = "right";
                        }
                        break;
                    default:
                        console.log("invalid worm direction input:", self.worms[x].direction, "wanted:", self.worms[x].newDirection);
                        break;
                }
                //console.log("handling worm", x);
                switch(self.worms[x].direction) {
                    case "right":
                        muutos += self.worms[x].velocity;
                        break;
                    case "left":
                        muutos -= self.worms[x].velocity;
                        break;
                    case "up":
                        muutos -= (self.gameArea.height)*(self.worms[x].velocity);
                        break;
                    case "down":
                        muutos += (self.gameArea.height)*(self.worms[x].velocity);
                        break;
                    default:
                        console.log("invalid worm direction:", self.worms[x].direction);
                        break;
                }

                // Liikuta matoa
                // Talleta hännän location
                var hanta = self.worms[x].location[0];

                // Talleta nykyinen pään location ja laske uuden pään location
                var length = self.worms[x].location.length;
                var oldHead = self.worms[x].location[length-1];
                var newHead = self.worms[x].location[length-1] + muutos;

                // Käsittele pelilaudan reunojen ylitykset
                // TODO: switch case
                if (self.worms[x].direction == "right" &&
                    0 == (newHead % self.gameArea.width) &&
                    0 != newHead ) {
                    newHead = oldHead - (self.gameArea.width-1);
                }
                if (self.worms[x].direction == "left" && 0 == (oldHead % (self.gameArea.width))) {
                    newHead = oldHead + (self.gameArea.width-1);
                }
                if (self.worms[x].direction == "up" && oldHead < self.gameArea.width) {
                    newHead = oldHead + (self.gameArea.height * (self.gameArea.width-1));
                }
                if (self.worms[x].direction == "down" && oldHead >= (self.gameArea.width*(self.gameArea.height - 1))) {
                    newHead = oldHead % (self.gameArea.width);
                }

                //console.log("self.worms[x].color:", self.worms[x].color);
                //console.log("direction", self.worms[x].direction, " oldHead:", oldHead, "newHead:", newHead);
                // Tarkista osuimmeko ruokaan (TODO: huomioi erilaiset foods, nyt vain foods[0])
                if (self.gameArea.cells[newHead] == self.foods[0].color) {
                    //console.log("food hit, increase worm");
                    // Osuimme, kasvata matoa
                    self.gameArea.cells[newHead] = self.worms[x].color;
                    self.worms[x].location.push(newHead);
                    self.removeFood(newHead);

                    // Kasvata pistemäärää
                    self.worms[x].score++;
                }
                else if (self.gameArea.cells[newHead] != self.gameArea.color) {
                    // TODO: lopeta game (poista mato kentältä vai jätä kentälle?)
                    //console.log("end game");
                    self.worms[x].alive = false;
                }
                else {
                    // Emme osuneet, aseta uusi pää ja leikkaa pala hännästä
                    //console.log("no food, move worm");
                    self.worms[x].location.push(newHead);
                    self.gameArea.cells[self.worms[x].location[0]] = self.gameArea.color;
                    self.gameArea.cells[newHead] = self.worms[x].color;
                    self.worms[x].location.shift();
                }
            }
        }
        // Lähetä päivitetyt tiedot (TODO: lähetä päivitys kaikille pelaajille)
        var msg = messages.message.MATCH_SYNC.new();
        var alive = false;
        for (var item in self.worms) {
            if (self.worms[item].alive == true) {
                alive=true;
                break;
            }
        }
        if (alive) {
            msg.phase = "RUN";
        }
        else {
            msg.phase = "END";
        }
        msg.msgid = 101;

        msg.worms = self.worms;
        msg.food = self.foods;

        self.syncPlayers(msg);
        if (msg.phase == "END") {
            self.endGame();
        }
        //console.log(self.worms);
    }

    self.init();

}

module.exports = GameServer;