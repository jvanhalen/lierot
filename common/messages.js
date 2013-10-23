// Sama koodi pitää toimia clientiessä ja serverissä, siksi tällainen funktiomäärittely
(function(exports){

    message = {
        id: "1",

        CHAT_SYNC: {
            message: {
                name: "CHAT_SYNC",
                username: null,  // Keneltä viesti tuli (username)
                text: null       // Viestin sisältö
            },
            new: function() {
                // Luo uusi kopio tästä viestistä
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        MATCH_SYNC: {
            message: {
                name: "MATCH_SYNC",
                phase: "INIT/RUN/END",
                msgid: null,
                players: [],
                food: []
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },        
        PLAYER_INPUT: {
            message: {
                name: "PLAYER_INPUT",
                username: "username",
                direction: "left/right/up/down"
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        QUEUE_MATCH: {
            message: {
                name: "QUEUE_MATCH",
                username: "username"
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        REG_REQ: {
            message: {
                name: "REG_REQ",   // Client lähettää tämän palvelimelle
                username: null,     // Clientin kyättäjänimi (lue html-lomakkeesta)
                passwordhash: null  // SHA1-koodattu salasanatiiviste (lue html-lomakkeesta ja generoi SHA1-tiiviste)
            },
            new: function() {
                // Luo uusi kopio tästä viestistä
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        REG_RESP: {
            message: {
                name: "REG_RESP",  // Palvelin vastaa clientille
                response: "OK/NOK"
            },
            new: function() {
                // Luo uusi kopio tästä viestistä
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        AUTH_REQ: {
            message: {
                name: "AUTH_REQ",   // Client lähettää tämän palvelimelle
                username: null,     // Clientin käyttäjänimi (lue html-lomakkeesta)
                passwordhash: null  // SHA1-koodattu salasanatiiviste (lue html-lomakkeesta ja generoi SHA1-tiiviste)
            },
            new: function() {
                // Luo uusi kopio tästä viestistä
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        AUTH_RESP: {
            message: {
                name: "AUTH_RESP",  // Palvelin vastaa clientille
                response: "OK/NOK"
            },
            new: function() {
                // Luo uusi kopio tästä viestistä
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        PING: {
            message: {
                name: "PING",
                value: 0    // Satunnainen merkkijono, vastaus samalla numerolla
            },
            new: function() {
                // Luo uusi kopio tästä viestistä
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        PONG: {
            message: {
                name: "PONG",
                value: 0      // Palvelimen generoima merkkijono, vastaus samalla merkkijonolla
            },
            new: function() {
                // Luo uusi kopio tästä viestistä
                return JSON.parse(JSON.stringify(this.message));
            }
        }
    }

    exports.message = message;

})(typeof exports === 'undefined'? this['messages']={}: exports);