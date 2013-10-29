var MessageHandler = function(game) {
    var self = this;
    self.game = game;
    self.username = undefined;
    self.messageBroker = undefined;

    self.receive = function(msg) {
        //console.log(msg);

        switch (msg.name) {
            case 'CHAT_SYNC':
                //console.log("chat_sync");
                if (msg.username == "System notice") {
                    document.getElementById('viestialue').innerHTML += '<div id="viesti">' + msg.username + ':&nbsp;&nbsp;' + msg.text + '</div>';
                }
                else {
                    document.getElementById('viestialue').innerHTML += '<div id="viesti"><a href="#" title="viesti">'+ msg.username + ':</a>&nbsp;&nbsp;' + msg.text + '</div>';
                }
                // Chatbox auto-scroll
                document.getElementById('keskustelualue').scrollTop += 20;
                break;

            case 'AUTH_RESP':
                console.log(msg.name, msg);
                if(msg.response == "OK" && msg.username) {
                    self.setUsername(msg.username);
                    document.getElementById('infoteksti').style.color = "black";
                    document.getElementById('infoteksti').innerHTML = "Kirjauduit käyttäjänä <strong>" +
                    msg.username + "</strong>";
                    document.getElementById('infoteksti').innerHTML += '<br /><input id="poistu_painike" type="submit" value="Poistu" onclick="poistu();">';
                    self.game.alustaPeli(null);
                }
                else {
                    var tmp = document.getElementById('infoteksti').innerHTML;
                    //console.log(tmp);
                    document.getElementById('infoteksti').style.color = "red";
                    document.getElementById('infoteksti').innerHTML = "Kirjautuminen epäonnistui";
                    var t = setTimeout(function() { document.getElementById('infoteksti').innerHTML = tmp; document.getElementById('infoteksti').style.color = "black"; }, 2000)
                }
                break;

            case 'MATCH_SYNC':
                self.game.updateMatch(msg);
                break;

            case 'REG_RESP':
                console.log(msg.name, msg.response);
                break;

            case 'PLAYER_LIST':
                self.updatePlayerList(msg);
                break;

            case 'SERVER_STATS':
                document.getElementById('palvelinloki').innerHTML = "";
                document.getElementById('palvelinloki').innerHTML += "<strong>System:</strong> " + msg.system + "<br />";
                document.getElementById('palvelinloki').innerHTML += "<strong>System load: </strong> " + msg.systemload[0].toPrecision(2) + "/" + msg.systemload[1].toPrecision(2) + "/" + msg.systemload[2].toPrecision(2) + " (load averages)<br />";
                document.getElementById('palvelinloki').innerHTML += "<strong>Mem usage: </strong> " + (msg.memusage.rss/1000000).toFixed(2) + "/" +  (msg.memusage.heapTotal/1000000).toFixed(2) + "/" + (msg.memusage.heapUsed/1000000).toFixed(2) + " (rss/total/used in MB)<br />";
                document.getElementById('palvelinloki').innerHTML += "<strong>Uptime: </strong> " + Math.round(msg.uptime) + " seconds<br />";
                document.getElementById('palvelinloki').innerHTML += "<strong>Users: </strong> " + msg.authenticatedusers + "/" + msg.connectedusers + "<br />";
                break;

            case 'CHALLENGE_REQ':
                self.handleChallengeRequest(msg);
                break;

            case 'CHALLENGE_RESP':
                self.handleChallengeResponse(msg);
                break;

            default:
                console.log("Default branch reached: ", msg);
                break;
        }
    },

    self.init = function() {
        console.log("MessageHandler started");
    },

    self.send = function(data) {
        self.messageBroker.send(data);
    },

    self.setUsername = function(username) {
        self.username = username;
        self.game.setUsername(username);
    },

    self.getUsername = function() {
        return self.username;
    },

    self.attachBroker = function(messageBroker) {
        self.messageBroker = messageBroker;
    },

    self.sortDivs = function(container) {
        //console.log("sorting", container);
        var toSort = container.children;
        //console.log("toSort:", toSort);
        toSort = Array.prototype.slice.call(toSort, 0);

        toSort.sort(function(a, b) {
            var aSort = a.id.toLowerCase(), //Text is the field on which we make sort
                bSort = b.id.toLowerCase();
            //console.log(aSort, ":", bSort);
            if (aSort === bSort) return 0;
            return aSort > bSort ? 1 : -1;
        });

        var parent = container;
        parent.innerHTML = "";

        for(var i=0, l = toSort.length; i<l; i++) {
            parent.appendChild(toSort[i]);
        }
    },

    self.updatePlayerList = function(msg) {
        switch(msg.type) {
            case 'update':
                console.log("preparing partial update on", document.getElementById('kirjautuneetpelaajat').innerHTML);
                for (var item in msg.players) {
                    console.log("partial update", item, ":", msg.players[item]);
                    // Update player entry
                    if (null != document.getElementById(msg.players[item].username) && undefined !== document.getElementById(msg.players[item].username)) {
                        console.log("removing earlier", document.getElementById(msg.players[item].username));
                        var rem = document.getElementById(msg.players[item].username);
                        rem.remove();
                    }

                    if (msg.players[item].authenticated == true || msg.players[item].authenticated == "true") {
                        var pre = '<div id="' + msg.players[item].username +'">';
                        var player = "";
                        if (msg.players[item].ingame == true || msg.players[item].username == self.getUsername()) {
                            player = msg.players[item].username;
                        }
                        else {
                            player = '<a href="#" title="haasta" onclick="challenge(\''+msg.players[item].username+'\')">'+ msg.players[item].username + '</a>';
                        }
                        post = '</div>';

                        document.getElementById('kirjautuneetpelaajat').innerHTML += pre + player + post;
                        console.log("update ready", document.getElementById('kirjautuneetpelaajat').innerHTML);
                    }
                    else {
                        console.log("removing", item, ":", document.getElementById(msg.players[item].username));
                        var rem = document.getElementById(msg.players[item].username);
                        rem.remove();
                    }
                }
                break;

            case 'full':
                console.log("full update");
                document.getElementById('kirjautuneetpelaajat').innerHTML = "";
                for(var item in msg.players) {
                    var minime = msg.players[item].username.toLowerCase();
                    var miniuser = self.getUsername().toLowerCase();
                    var pre = '<div id="' + msg.players[item].username +'">';
                    var player = "";
                    if (msg.players[item].ingame == false && minime != miniuser) {
                        player = ' <a href="#" title="haasta" onclick="challenge(\''+msg.players[item].username+'\')">'+ msg.players[item].username + '</a>';
                    }
                    else {
                        player = msg.players[item].username;
                    }
                    post = '</div>';
                    document.getElementById('kirjautuneetpelaajat').innerHTML += pre + player + post;
                }
                break;

            default:
                console.log("MessageHandler.updatePlayerList: default branch reached");
                break;
        }
        self.sortDivs(document.getElementById('kirjautuneetpelaajat'));
    },

    self.handleChallengeRequest = function(msg) {
        // Pop a dialog
        //document.getElementById('haasteajastin').innerHTML = "10";

        var audio = document.getElementById('challenge_request_audio');
        audio.volume = 0.4;
        audio.play();

        console.log("handleChallengeRequest", msg);
        document.getElementById('haaste').innerHTML = 'You\'ve been challenged by<br /><strong>' + msg.challenger + '</strong><br />';
        document.getElementById('haaste').innerHTML += '<input type="button" value="Accept" onclick="acceptChallenge(\''+msg.challenger+'\')"><input type="button" value="Reject" onclick="rejectChallenge(\''+msg.challenger+'\')">';
        document.getElementById('haastelaatikko').style.visibility="visible";
        self.challengeTmo = setTimeout("rejectChallenge(\'" + msg +"\')", 10000);
        //setInterval("self.challengeTimer("+msg+")", 1000);
    },
/*
    self.challengeTimer = function(number) {
        document.getElementById('haasteajastin').innerHTML = "<strong>" + number + "</strong>";
        number--;
    },
*/
    self.acceptChallenge = function(challenger) {
        clearTimeout(self.challengeTmo);
        console.log("handleChallengeRequest from", challenger);
        var resp = messages.message.CHALLENGE_RESP.new();

        resp.response = "OK";
        resp.challenger = self.getUsername();
        resp.challengee = challenger;
        self.send(resp);
        document.getElementById('haastelaatikko').style.visibility="hidden";
    },

    self.rejectChallenge = function(challenger) {
        clearTimeout(self.challengeTmo);
        console.log("handleChallengeRequest from", challenger);
        var resp = messages.message.CHALLENGE_RESP.new();
        resp.response = "NOK";
        resp.challenger = self.getUsername();
        resp.challengee = challenger;
        self.send(resp);
        document.getElementById('haastelaatikko').style.visibility="hidden";
    },

    self.handleChallengeResponse = function(msg) {
        console.log(msg);
    }

    self.init();
}