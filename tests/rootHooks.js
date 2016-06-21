//Mocha root level hooks
var cp = require('child_process');
var http = require('http');

before("Run Server", function (done) {
    //restore database before each test
    //windows will not set this NODE_ENV variable
    //so those users must manually restore and remove the test database
    //run this manuually before the tests:
    //psql -U postgres -f tests/files/Drop_FCO_LOI_User_Test.sql
    //then
    //psql -U postgres -f tests/files/FCO_LOI_User_Test.sql
    if (process.env.NODE_ENV === 'test') {
        var psqlRestore = "PGPASSWORD=" + config.config().pgpassword + " psql -U postgres -f tests/files/FCO_LOI_User_Test.sql";
        cp.exec(psqlRestore, function (err, stdout, stderr) {
            if (stderr) {
                console.log(stderr);
            }

            var server = require("../server.js").getApp;
            done();
        });
    }
    else{
        var server = require("../server.js").getApp;
        done();
    }
});


//drop the test database
after(function (done) {
    if (process.env.NODE_ENV === 'test') {
        var psqlDrop = "PGPASSWORD=" + config.config().pgpassword + " psql -U postgres -f tests/files/Drop_FCO_LOI_User_Test.sql";
        cp.exec(psqlDrop, function (err, stdout, stderr) {
            if (stderr) {
                console.log(stderr);
            }
            done();
        });
    }
    else{
        var server = require("../server.js").getApp;
        done();
    }
});