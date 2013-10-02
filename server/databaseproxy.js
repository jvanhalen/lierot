var DatabaseProxy = function() {

    // Määrittele scope
    var self = this;
    self.messageHandler = undefined;

    // luokansisäiset globaalit
    var mydb;
    var mysql;

    self.init = function() {

    // yhteystiedot globaaliolioon
    mydb = {
        "hostname": process.env.OPENSHIFT_MYSQL_DB_HOST,
        "user": process.env.OPENSHIFT_MYSQL_DB_USERNAME,
        "password": process.env.OPENSHIFT_MYSQL_DB_PASSWORD,
        "database": "matopeli"
    };

    // Alusta yhteys tietokantaan
    console.log("Connecting database...");
    mysql = require('db-mysql');

    new mysql.Database(mydb).on('error', function(error) {
        console.log('ERROR: ' + error);
        }).on('ready', function(server) {
            console.log('Connected to ' + server.hostname + ' (' + server.version + ')');
        }).connect();


    // Testaa luokan metodeita
    self.test();

    },


/*  ====================================================================================
    Metodi: handleResponse : void
    Parametrit: type, param
    Palauttaa MessageHandlerin kautta: kyselyn tulokset tai virheilmoituksen
    Kuvaus: Palauttaa kaikkien kyselyiden tulokset jatkokäsittelyä varten
    ====================================================================================  */

// metodi keskeneräinen, nykyisellään laittaa vasta jotain data lokiin, eikä muuta

    self.handleResponse = function(from, msgname, type, param) {

        if (type == 'result') { // select kyselyn tulos
            rows=param['rows']; cols=param['cols'];
            console.log("handleresponse: ", rows.length + ' ROWS found');
        }

        if (type == 'feedback') { // delete, insert, update kyselyn tulos
            result=param['result'];
            console.log("handleresponse: ", result);
            self.messageHandler.handleDatabaseResponse(from, msgname, result);
        }

        if (type == 'queryerror') { // saatiin virheilmoitus
            error=param['error'];
            console.log("handleresponse: query error ", error);
        }

        if (type == 'connectionerror') { // saatiin virheilmoitus
            error=param['error'];
            console.log("handleresponse: connection error ", error);
        }

    },


/*  ====================================================================================
    Metodi: attachHandler: (msghandler: object) : void
    Toiminta: Liittää messageHandler-olion self.messageHandleriin
    ====================================================================================  */

    self.attachHandler = function(msghandler) {
        self.messageHandler = msghandler;
    }


/*  ====================================================================================
    Metodi: reconnect: (connection: object)
    Toiminta: Ei tietoa, mitä tämä tulee tekemään
    ====================================================================================  */

    self.reconnect = function(connection) {

    },


/*  ====================================================================================
    Metodi: getLogin: (username: string) : void
    Toiminta: Haetaan sisäänkirjautumista varten käyttäjänimeä vastaava salasanan tarkiste, ID ja käyttäjätilin tila
    Palauttaa MessageHandlerin kautta: UserAccount: PasswordHash, ID, UserStatus
    ====================================================================================  */

    self.getLogin = function(username) {

        new mysql.Database(mydb).connect(function(error) {
            if (error) {
                self.handleResponse('connectionerror', {'error':error});
                return;
            }
            this.query().
                select('PasswordHash, ID, UserStatus').
                from('UserAccount').
                where('UserName = ?', [ username ]).
                execute(function(error, rows, cols) {
                    if (error) {
                            self.handleResponse('queryerror', {'error':error});
                            return;
                    }
                    self.handleResponse('result', {'rows':rows, 'cols':cols});
                });
            return 0;
        });

    },


/*  ====================================================================================
    Metodi: getUserAccount: (userid: int) : void
    Toiminta: Haetaan käyttäjän id:tä vastaavat kaikki tilitiedot, paitsi id, sessionkey ja salasanan tarkiste
    Palauttaa MessageHandlerin kautta: UserAccount: UserName, Email, SessionKey, LastLogin, UserStatus
    ====================================================================================  */

    self.getUserAccount = function(userid) {

        new mysql.Database(mydb).connect(function(error) {
            if (error) {
                self.handleResponse('connectionerror', {'error':error});
                return;
            }
            this.query().
                select('UserName, Email, SessionKey, LastLogin, UserStatus').
                from('UserAccount').
                where('ID = ?', [ userid ]).
                execute(function(error, rows, cols) {
                    if (error) {
                            self.handleResponse('queryerror', {'error':error});
                            return;
                    }
                    self.handleResponse('result', {'rows':rows, 'cols':cols});
                });
            return 0;
        });

    },


/*  ====================================================================================
    Metodi: getSessionKey: (userid: int) : void
    Toiminta: Haetaan käyttäjän id:tä vastaava istunnon avain
    Palauttaa MessageHandlerin kautta: UserAccount: SessionKey
    ====================================================================================  */

    self.getSessionKey = function(userid) {

        new mysql.Database(mydb).connect(function(error) {
            if (error) {
                self.handleResponse('connectionerror', {'error':error});
                return;
            }
            this.query().
                select('SessionKey').
                from('UserAccount').
                where('ID = ?', [ userid ]).
                execute(function(error, rows, cols) {
                    if (error) {
                            self.handleResponse('queryerror', {'error':error});
                            return;
                    }
                    self.handleResponse('result', {'rows':rows, 'cols':cols});
                });
            return 0;
        });

    },


/*  ====================================================================================
    Metodi: newUserAccount: (UserName: string, PasswordHash: string, Email: string) : void
    Toiminta: Luodaan uusi käyttäjätili tietokantaan, oletuksena tili on inaktiivinen ja käyttäjä ei-sisäänkirjautunut
    Palauttaa MessageHandlerin kautta: tulokset
    ====================================================================================  */

    self.newUserAccount = function(from, msgname, username, passwordhash, email) {

        new mysql.Database(mydb).connect(function(error) {
            if (error) {
                self.handleResponse('connectionerror', {'error':error});
                return;
            }
            this.query().
                insert('UserAccount',
                    ['UserName', 'PasswordHash', 'Email'],
                    [username, passwordhash, email]
                ).
                execute(function(error, result) {
                    if (error) {
                            self.handleResponse(from, msgname, 'queryerror', {'error':error});
                            return;
                    }
                    self.handleResponse(from, msgname, 'feedback', {'result':result});
                });
            return 0;
        });

    },


/*  ====================================================================================
    Metodi: setUserAccount: (userid: int, UserName: string, PasswordHash: string, Email: string) : void
    Toiminta: Päivittää kaikki käyttäjätilin tiedot, paitsi käyttäjätilin tilan ja viimeisimmän sisäänkirjautumisen
    Palauttaa MessageHandlerin kautta: tulokset
    ====================================================================================  */

    self.setUserAccount = function(userid, username, passwordhash, email) {

        new mysql.Database(mydb).connect(function(error) {
            if (error) {
                self.handleResponse('connectionerror', {'error':error});
                return;
            }
            this.query().
                update('UserAccount').
                set({ 'UserName': username, 'PasswordHash': passwordhash, 'Email': email}).
                where('ID = ?', [ userid ])
                execute(function(error, result) {
                    if (error) {
                        self.handleResponse('queryerror', {'error':error});
                        return;
                    }
                    self.handleResponse('feedback', {'result':result});
                });
            return 0;
        });

    },


/*  ====================================================================================
    Metodi: setUserAccountActive: (userid: int) : void
    Toiminta: Vaihtaa käyttäjä id:tä vastaavan käyttäjätilin tilan aktiiviseksi
    Palauttaa MessageHandlerin kautta: tulokset
    ====================================================================================  */

    self.setUserAccountActive = function(userid) {

        new mysql.Database(mydb).connect(function(error) {
            if (error) {
                self.handleResponse('connectionerror', {'error':error});
                return;
            }
            this.query().
                update('UserAccount').
                set({ 'UserStatus': '1' }).
                where('ID = ?', [ userid ])
                execute(function(error, result) {
                    if (error) {
                        self.handleResponse('queryerror', {'error':error});
                        return;
                    }
                    self.handleResponse('feedback', {'result':result});
                });
            return 0;
        });

    },


/*  ====================================================================================
    Metodi: setUserAccountInactive: (userid: int) : void
    Toiminta: Vaihtaa käyttäjä id:tä vastaavan käyttäjätilin tilan epäaktiiviseksi
    Palauttaa MessageHandlerin kautta: tulokset
    ====================================================================================  */

    self.setUserAccountInactive = function(userid) {

        new mysql.Database(mydb).connect(function(error) {
            if (error) {
                self.handleResponse('connectionerror', {'error':error});
                return;
            }
            this.query().
                update('UserAccount').
                set({ 'UserStatus': '0' }).
                where('ID = ?', [ userid ])
                execute(function(error, result) {
                    if (error) {
                        self.handleResponse('queryerror', {'error':error});
                        return;
                    }
                    self.handleResponse('feedback', {'result':result});
                });
            return 0;
        });

    },


/*  ====================================================================================
    Metodi: setLastLogin: (userid: int) : void
    Toiminta: Talletetaan tietokantaan käyttäjälle kirjautumisen ajankohta, joka on sama kuin metodin kutsumahetki
    Palauttaa MessageHandlerin kautta: tulokset
    ====================================================================================  */

    self.setLastLogin = function(userid) {

        new mysql.Database(mydb).connect(function(error) {
            if (error) {
                self.handleResponse('connectionerror', {'error':error});
                return;
            }
            this.query().
                update('UserAccount').
                set({ 'LastLogin': {value: 'NOW', escape: false} }).
                where('ID = ?', [ userid ])
                execute(function(error, result) {
                    if (error) {
                        self.handleResponse('queryerror', {'error':error});
                        return;
                    }
                    self.handleResponse('feedback', {'result':result});
                });
            return 0;
        });

    },


/*  ====================================================================================
    Metodi: setSessionKey: (userid: int, sessionkey: string) : void
    Toiminta: Talletetaan tietokantaan käyttäjälle kirjautumisen ajankohta, joka on sama kuin metodin kutsumahetki
    Palauttaa MessageHandlerin kautta: tulokset
    ====================================================================================  */

    self.setSessionKey = function(userid, sessionkey) {

        new mysql.Database(mydb).connect(function(error) {
            if (error) {
                self.handleResponse('connectionerror', {'error':error});
                return;
            }
            this.query().
                update('UserAccount').
                set({ 'SessionKey': sessionkey}).
                where('ID = ?', [ userid ])
                execute(function(error, result) {
                    if (error) {
                        self.handleResponse('queryerror', {'error':error});
                        return;
                    }
                    self.handleResponse('feedback', {'result':result});
                });
            return 0;
        });

    },


/*  ====================================================================================
    Metodi: newChatMessage: (UserAccountID: int, Message: string) : void
    Toiminta: Luodaan uusi käyttäjätili tietokantaan, oletuksena tili on inaktiivinen ja käyttäjä ei-sisäänkirjautunut
    Palauttaa MessageHandlerin kautta: tulokset
    ====================================================================================  */

    self.newChatMessage = function(useraccountid, message) {

        new mysql.Database(mydb).connect(function(error) {
            if (error) {
                self.handleResponse('connectionerror', {'error':error});
                return;
            }
            this.query().
                insert('ChatMessage',
                    ['UserAccountID', 'Message', 'MessageDate'],
                    [useraccountid, message, {value: 'NOW', escape: false}]
                ).
                execute(function(error, result) {
                    if (error) {
                            self.handleResponse('queryerror', {'error':error});
                            return;
                    }
                    self.handleResponse('feedback', {'result':result});
                });
            return 0;
        });

    },


/*  ====================================================================================
    Metodi: getChatMessages: (begin:?, end:?) : void
    Toiminta: Hakee kaikki chat-viestit tietyltä aikaväliltä
    Palauttaa MessageHandlerin kautta: ChatMessage: ID, UserAccountID, Message, MessageDate
    ====================================================================================  */


    self.getChatMessages = function(begin, end) {

        new mysql.Database(mydb).connect(function(error) {
            if (error) {
                self.handleResponse('connectionerror', {'error':error});
                return;
            }
            this.query().
                select('*').
                from('ChatMessage').
                where('MessageDate > ? AND MessageDate < ?', [ begin, end ]).  // tämä voi tarvita timestamp muunnoksen tms
                order({'MessageDate': true}).  // tässä haetaan nousevassa järjestyksessä eli vanhin ensin
                execute(function(error, rows, cols) {
                    if (error) {
                            self.handleResponse('queryerror', {'error':error});
                            return;
                    }
                    self.handleResponse('result', {'rows':rows, 'cols':cols});
                });
            return 0;
        });

    },


/*  ====================================================================================
    Metodi: getChatMessagesByUser: (begin, end, userid) : void
    Toiminta: hakee tietyn käyttäjän kaikki chat-viestit tietyltä aikaväliltä
    Palauttaa MessageHandlerin kautta:
    ====================================================================================  */


    self.getChatMessagesByUser = function(begin, end, userid) {

        new mysql.Database(mydb).connect(function(error) {
            if (error) {
                self.handleResponse('connectionerror', {'error':error});
                return;
            }
            this.query().
                select('*').
                from('ChatMessage').
                where('MessageDate > ? AND MessageDate < ? AND UserAccountID = ?', [ begin, end, userid ]).  // tämä voi tarvita timestamp muunnoksen tms
                order({'MessageDate': true}).  // tässä haetaan nousevassa järjestyksessä eli vanhin ensin
                execute(function(error, rows, cols) {
                    if (error) {
                            self.handleResponse('queryerror', {'error':error});
                            return;
                    }
                    self.handleResponse('result', {'rows':rows, 'cols':cols});
                });
            return 0;
        });

    },


/*  ====================================================================================
    Metodi: test: () : void
    Toiminta: Tällä voi "kuivatestata" luokan metodeja
    Palauttaa MessageHandlerin kautta: sitä saa mitä tilaa
    ====================================================================================  */


    self.test = function() {



    }



    // Alusta tietokantayhteys olion luonnin yhteydessä
    self.init();
}

module.exports = DatabaseProxy;