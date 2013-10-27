var MessageHandler = function(peli) {
    var self = this;
    self.peli = peli;
    self.username = undefined;
    self.messageBroker = undefined;

    self.receive = function(msg) {
        //console.log(msg);

        switch (msg.name) {
            case 'CHAT_SYNC':
                //console.log("chat_sync");
                document.getElementById('viestialue').innerHTML += '<div id="viesti"><a href="#" title="viesti">'+ msg.username + ':</a>&nbsp;&nbsp;' + msg.text + '</div>';
                // Chatbox auto-scroll
                document.getElementById('keskustelualue').scrollTop += 20;
                break;

            case 'AUTH_RESP':
                //console.log(msg.name, msg.response);
                if(msg.response == "OK") {
                    self.setUsername(document.getElementById('kayttajanimi').value);
                    document.getElementById('infoteksti').style.color = "black";
                    document.getElementById('infoteksti').innerHTML = "Kirjauduit käyttäjänä <strong>" +
                    document.getElementById('kayttajanimi').value + "</strong>";
                    document.getElementById('infoteksti').innerHTML += '<br /><input id="poistu_painike" type="submit" value="Poistu" onclick="poistu();">';
                    self.peli.alustaPeli(null);
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
                self.peli.paivitaTilanne(msg);
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
    },
    
    self.getUsername = function() {
        return self.username;
    },

    self.attachBroker = function(messageBroker) {
        self.messageBroker = messageBroker;
    },
    // ty guys @ http://stackoverflow.com/questions/5066925/javascript-only-sort-a-bunch-of-divs
    // From example: http://jsfiddle.net/fkling/nXkDp/
    self.sortDivs = function(container) {
        console.log("sorting", container);
        var toSort = container.children;
        console.log("toSort:", toSort);
        toSort = Array.prototype.slice.call(toSort, 0);
        
        toSort.sort(function(a, b) {
            var aSort = a.id.toLowerCase(), //Text is the field on which we make sort
                bSort = b.id.toLowerCase();
            console.log(aSort, ":", bSort);
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
                for (var item in msg.players) {
                    console.log("update", item, ":", msg.players[item]);
                    // Update player entry
                    if (msg.players[item].authenticated == true || msg.players[item].authenticated == "true") {
                        var pre = '<div id="' + msg.players[item].username +'">';
                        var player = msg.players[item].username;
                        if (msg.players[item].ingame == false) {
                            player += ' <a href="#" title="haasta">x</a>';
                        }
                        post = '</div>';
                        
                        if (null == document.getElementById(msg.players[item].username)) {
                            // div does not exist, create it
                            console.log("create new entry", msg.players[item].username);
                            document.getElementById('kirjautuneetpelaajat').innerHTML += (pre + player + post);
                            console.log("update", pre + player + post);
                        }
                        else {
                            console.log("update original", document.getElementById(msg.players[item].username).innerHTML);
                            document.getElementById(msg.players[item].username).innerHTML = player;
                            console.log("update new", document.getElementById(msg.players[item].username).innerHTML);

                        }
                        console.log("update ready", document.getElementById('kirjautuneetpelaajat').innerHTML);
                    }
                    else {
                        //console.log("removing", item, ":", document.getElementById(msg.players[item].username));
                        var rem = document.getElementById(msg.players[item].username);
                        rem.remove();
                    }
                }
                break;
            
            case 'full':
                console.log(msg.type, "update");
                document.getElementById('kirjautuneetpelaajat').innerHTML = "";
                for(var item in msg.players) {
                    var player = '<div id="' + msg.players[item].username +'">' + msg.players[item].username;
                    if (msg.players[item].ingame == false) {
                        player += ' <a href="#" title="haasta">x</a>';
                    }
                    player += '</div>';
                    document.getElementById('kirjautuneetpelaajat').innerHTML += player;
                }
                break;
            
            default:
                console.log("MessageHandler.updatePlayerList: default branch reached");
                break;            
        }
        self.sortDivs(document.getElementById('kirjautuneetpelaajat'));
    }

    self.init();
}