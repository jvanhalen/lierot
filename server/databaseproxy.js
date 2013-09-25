var DatabaseProxy = function() {

    // Määrittele scope
    var self = this;

    self.init = function() {

    self.hostname = process.env.OPENSHIFT_MYSQL_DB_HOST; // + ":" + process.env.OPENSHIFT_MYSQL_DB_PORT;
    self.username = process.env.OPENSHIFT_MYSQL_DB_USERNAME;
    self.password = process.env.OPENSHIFT_MYSQL_DB_PASSWORD;
    self.database = "matopeli";

    // Alusta yhteys tietokantaan
    console.log("Connecting database...");
    var mysql = require('db-mysql');

    new mysql.Database({"hostname": self.hostname,
                        "user": self.username,
                        "password": self.password,
                        "database": self.database
        }).on('error', function(error) {
        console.log('ERROR: ' + error);
        }).on('ready', function(server) {
            console.log('Connected to ' + server.hostname + ' (' + server.version + ')');
        }).connect();

        // Tee yksinkertainen kysely chat-viesteihin
        self.querychat();
    },

    self.querychat = function() {
        var mysql = require('db-mysql');
        
        new mysql.Database({"hostname": self.hostname,
                            "user": self.username,
                            "password": self.password,
                            "database": self.database
        }).connect(function(error) {
            if (error) {
                return console.log('CONNECTION error: ' + error);
            }
            this.query().
                select('*').
                from('ChatMessage').
                //where('approved = ?', [ true ]).
                //order({'created': false}).
                execute(function(error, rows, cols) {
                        if (error) {
                                console.log('ERROR: ' + error);
                                return;
                        }
                        console.log(rows.length + ' ROWS found');
                });
                return 0;
        });
    }
}

module.exports = DatabaseProxy;