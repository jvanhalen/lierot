var messages = require('../common/messages');

var mato = function(nimi, numero){  // Tällä määrittelyllä varaudutaan siihen että lieroja on tulevaisuudessa useampiakin
    var self = this;
    self.elossa = true; // true / false
    self.nimi = nimi;
    self.vari = "blue";
    self.aloitusPituus = 5;
    self.pituus = self.aloitusPituus;
    self.sijainti = [];
    self.suunta = "oikea"; // Menosuunta: oikea, vasen, ylos, alas
    self.nopeus = 1;
    self.pisteet = 0;

    // Alusta mato
    for(var x=0; x<self.aloitusPituus; x++) {
        self.sijainti[x] = x;
    }
}

var ruoka = function(sijainti){
    var self = this;
    self.sijainti = sijainti;
    self.vari = "red";
    self.kasvu = Math.floor(Math.random()*1+1); // Paljonko mato kasvaa ruoan napsittuaan, laita esim. +0 --> +1
}

var pelialue = function() {
    var self = this;
    self.solut = [];
    self.korkeus = 40;
    self.leveys = 40;
    self.vari = "lightblue";   // Ruudukon väri
}

// Pelipalvelimen määrittely alkaa tästä
var GameServer = function(messagehandler) {
    
    var self = this;
    self.systemtimer = 0;
    self.messageHandler = messagehandler;
    self.messageHandler.attachGameServer(self);
    self.gameSessions = {};
    
    self.queueMatch = function(from, data) {
        console.log("queue match", data);
        // TODO: better matchmaking for multiplayer games
        if (undefined !== self.gameSessions[data.username]) {
            // Already in game, do we have to respond something?
        }
        else {
            var playerList = [{
                websocket: from,
                username: data.username
            }];
            self.createGame(playerList);
        }
    },
    
    self.createGame = function(playerList) {
        var game = new Peli(playerList, self.messageHandler, self);
        // Connect players to the game
        for (var x=0; x<playerList.length; x++) {
            self.gameSessions[playerList[x].username] = {player: playerList[x], game: game};
        }
    },
    
    self.endGame = function(playerList) {
        //console.log("GameServer.endGame");
        var game = playerList[0].game;
        for (var x=0; x<playerList.length; x++) {
            delete self.gameSessions[playerList[x].username];
        }
    },
    
    self.userData = function(from, msg) {
        switch (msg.name) {
            case 'DISCONNECT_REQ':
                console.log("DISCONNECT_REQ from", msg.username);
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
    
    self.systemTimer = function() {

    /*
        // Send user data to clients
        // TODO: olisiko parempi lähettää kerran sekunnissa, jos paljon käyttäjiä?
        var msg = messages.message.PLAYER_LIST.new();
        for(var x=0; x<self.messageBroker.connectedClients.length; x++) {
            msg.players.push({username: self.messageBroker.connectedClients[x].username,
                              ingame: self.messageBroker.connectedClients[x].ingame,
                              rank: 0});
        }
        self.broadcast(msg);
        */
    }
    
    var timer = setInterval(self.systemTimer, 1000);
}

var Peli = function(playerList, messageHandler, gameServer) {

    var self = this;

    self.messageHandler = messageHandler;
    self.gameServer = gameServer;

    self.ajastin = 0;
    self.ruoanMaara = 8;
    self.pelialue = null;
    self.madot = [];
    self.ruoat = [];
    self.sessionId = 1;
    self.playerList = playerList;
    
    //console.log(playerList.length);
    
    self.alusta = function() {
        console.log("creating new game for", self.playerList.length, "players.");

        self.pelialue = new pelialue();
        for (var x=0; x<self.playerList.length; x++) {
            self.madot.push(new mato(self.playerList[x].username, x));
        }
        self.alustaPelilauta();
        self.asetaLierot();
        self.asetaRuoat();

        var msg = messages.message.MATCH_SYNC.new();
        msg.phase = "INIT";
        msg.msgid = 101;

        msg.worms = self.madot;
        msg.food = self.ruoat;

        self.syncPlayers(msg);
        
        // Huomioi setInterval scope .bind(self)
        self.ajastin = setInterval(self.paivitaTilanne, 150);
    },

    self.alustaPelilauta = function() {
        //console.log("alustaPelilauta");
        for(var i=0; i<self.pelialue.korkeus*self.pelialue.leveys; i++) {
            self.pelialue.solut[i] = self.pelialue.vari;
        }
    },

    self.asetaLierot = function() {
        // Aseta liero(t) aloituskohtaan
        for (var i=0; i<self.madot.length; i++) {
            for(var x=0;x<self.madot[i].aloitusPituus;x++) {
                self.pelialue.solut[x] = self.madot[i].vari;
            }
        }        
    },
    
    self.asetaRuoat = function() {
        //console.log("asetaRuoat");
        // Tarkista puuttuuko ruokia
        // Aseta ruoat satunnaiseen kohtaan
        var i = 0;

        while(self.ruoat.length < self.ruoanMaara) {
            var x = Math.floor(Math.random()*self.pelialue.korkeus*self.pelialue.leveys);

            // Jos paikka on vapaa, aseta siihen uusi ruoka
            if (self.pelialue.solut[x] == self.pelialue.vari) {
                //console.log("uusi ruoka:", x);
                var uusiruoka = new ruoka(x);
                self.ruoat.push(uusiruoka);
                self.pelialue.solut[x] = uusiruoka.vari;
            }
        }
    },

    self.poistaRuoka = function(ruutu) {
        //console.log("poistaRuoka", ruutu);
        for (var x=0;x<self.ruoat.length; x++) {
            if (self.ruoat[x].sijainti == ruutu) {
                self.ruoat.splice(x, 1);
            }
        }
        // Arvo uusi ruoka
        self.asetaRuoat();

    },

    self.paivitaTilanne = function() {
        //console.log("paivitaTilanne");

        // Lue ja käsittele syöte
        //document.getElementById("syote").focus();
        var syote = 0; //document.getElementById("syote").value;
        var muutos = 0;

        // Käy läpi kaikki pelissä olevat madot (huom! matojen päivitysjärjestyksellä on merkitystä mm. törmäystarkistuksissa)
        for (var x=0; x<self.madot.length; x++) {
            // Siirrä vain elossa olevia matoja
            if(self.madot[x].elossa == true)
            {
                //console.log("handling worm", x);
                switch(self.madot[x].suunta) {
                    case "oikea":
                        muutos += self.madot[x].nopeus;
                        break;
                    case "vasen":
                        muutos -= self.madot[x].nopeus;
                        break;
                    case "ylos":
                        muutos -= (self.pelialue.korkeus)*(self.madot[x].nopeus);
                        break;
                    case "alas":
                        muutos += (self.pelialue.korkeus)*(self.madot[x].nopeus);
                        break;
                    default:
                        console.log("invalid worm direction:", self.madot[x].suunta);
                        break;
                }
    
                // Liikuta matoa
                // Talleta hännän sijainti
                var hanta = self.madot[x].sijainti[0];
    
                // Talleta nykyinen pään sijainti ja laske uuden pään sijainti
                var pituus = self.madot[x].sijainti.length;
                var wanhaPaa = self.madot[x].sijainti[pituus-1];
                var uusiPaa = self.madot[x].sijainti[pituus-1] + muutos;
    
                // Käsittele pelilaudan reunojen ylitykset
                // TODO: switch case
                if (self.madot[x].suunta == "oikea" &&
                    0 == (uusiPaa % self.pelialue.leveys) &&
                    0 != uusiPaa ) {
                    uusiPaa = wanhaPaa - (self.pelialue.leveys-1);
                }
                if (self.madot[x].suunta == "vasen" && 0 == (wanhaPaa % (self.pelialue.leveys))) {
                    uusiPaa = wanhaPaa + (self.pelialue.leveys-1);
                }
                if (self.madot[x].suunta == "ylos" && wanhaPaa < self.pelialue.leveys) {
                    uusiPaa = wanhaPaa + (self.pelialue.korkeus * (self.pelialue.leveys-1));
                }
                if (self.madot[x].suunta == "alas" && wanhaPaa >= (self.pelialue.leveys*(self.pelialue.korkeus - 1))) {
                    uusiPaa = wanhaPaa % (self.pelialue.leveys);
                }
    
                //console.log("self.madot[x].vari:", self.madot[x].vari);
                //console.log("suunta", self.madot[x].suunta, " wanhaPaa:", wanhaPaa, "uusiPaa:", uusiPaa);
                // Tarkista osuimmeko ruokaan (TODO: huomioi erilaiset ruoat, nyt vain ruoat[0])
                if (self.pelialue.solut[uusiPaa] == self.ruoat[0].vari) {
                    //console.log("food hit, increase worm");
                    // Osuimme, kasvata matoa
                    self.pelialue.solut[uusiPaa] = self.madot[x].vari;
                    self.madot[x].sijainti.push(uusiPaa);
                    self.poistaRuoka(uusiPaa);
    
                    // Kasvata pistemäärää
                    self.madot[x].pisteet++;
                }
                // TODO: miten huomioida eri väriset madot?
                else if (self.pelialue.solut[uusiPaa] == self.madot[x].vari) {
                    // TODO: lopeta peli (poista mato kentältä vai jätä kentälle?)
                    //console.log("end game");
                    self.madot[x].elossa = false;
                }
                else {
                    // Emme osuneet, aseta uusi pää ja leikkaa pala hännästä
                    //console.log("no food, move worm");
                    self.madot[x].sijainti.push(uusiPaa);
                    self.pelialue.solut[self.madot[x].sijainti[0]] = self.pelialue.vari;
                    self.pelialue.solut[uusiPaa] = self.madot[0].vari;
                    self.madot[x].sijainti.shift();
                }
            }
        } 
        // Lähetä päivitetyt tiedot (TODO: lähetä päivitys kaikille pelaajille)
        var msg = messages.message.MATCH_SYNC.new();
        var elossa = false;
        for (var item in self.madot) {
            if (self.madot[item].elossa == true) {
                elossa=true;
                break;
            }
        }
        if (elossa) {
            msg.phase = "RUN";
        }
        else {
            msg.phase = "END";
        }
        msg.msgid = 101;

        msg.worms = self.madot;
        msg.food = self.ruoat;
        
        self.syncPlayers(msg);
        if (msg.phase == "END") {
            self.endGame();
        }
    },

    self.syncPlayers = function(msg) {
        //console.log("Peli.syncPlayers", msg);
        for (var x=0; x<self.playerList.length; x++) {
            self.messageHandler.send(self.playerList[x].websocket, msg);
        }
    },
    
    self.userInput = function(msg) {
        // TODO: check user input validity
        // TODO: Route msg to user specific match
        for (var x=0; x<self.madot.length; x++) {
            //console.log("handling worm", x);
            if (self.madot[x].nimi == msg.username) {
                switch (msg.direction) {
                    case "ylos":
                        if (self.madot[x].suunta != "alas") {
                            self.madot[x].suunta = "ylos";
                        }
                        break;
        
                    case "vasen":
                        if (self.madot[x].suunta != "oikea") {
                            self.madot[x].suunta = "vasen";
                        }
                        break;
        
                    case "alas":
                        if (self.madot[x].suunta != "ylos") {
                            self.madot[x].suunta = "alas";
                        }
                        break;
        
                    case "oikea":
                        if (self.madot[x].suunta != "vasen") {
                            self.madot[x].suunta = "oikea";
                        }
                        break;
                    default:
                        console.log("invalid worm direction input:", self.madot[x].suunta);
                        break;
                }
            }
        }
    },
    
    self.disconnect = function(data) {
        for (var x=0; x<self.madot.length; x++) {
            if (self.madot[x].nimi == data.username) {
                self.madot[x].elossa = false;
                break;
            }
        }        
    },
    
    self.endGame = function() {
        // TODO: lopeta peli
        clearInterval(self.ajastin);
        self.gameServer.endGame(self.playerList);
    }
    
    self.alusta();

}

module.exports = GameServer;