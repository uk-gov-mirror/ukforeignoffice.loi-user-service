var sequelize = require('../../app/sequelize.js');
var Model = require('../../app/model/models.js');
var baseUrl = 'http://localhost:6000/api/user';
var server = request.agent(baseUrl);

describe('Work with Users', function () {
    it('registers a new user', function (done) {
        var newUser = {
            "email":"bob@example.com",
            "confirm_email":"bob@example.com",
            "password" : "P@ssw0rd16",
            "confirm_password" : "P@ssw0rd16",
            "all_info_correct" : "on",
            "business_yes_no": false,
            "company_name": ""
        };

        request(baseUrl).post('/register')
            .send(newUser)
            .expect(302)
            .end(function (err, res) {
                if (err) return done(err);

                //expect status to be submitted
                Model.User.findOne(
                    {
                        where: {
                            email: "bob@example.com"
                        }
                    }
                ).then(function (results) {
                    expect(results.dataValues.email).to.equal('bob@example.com');
                    expect(results.dataValues.activated).to.equal(false);
                    done();
                }).catch(function (error) {
                    done(error);
                });
            });
    });


    it('cannot sign-in if email is not verified', function (done) {
        var newUser = {
            "email":"bob@example.com",
            "password" : "P@ssw0rd16"
        };

        request(baseUrl).post('/sign-in')
            .send(newUser)
            .expect(302)
            .end(function (err, res) {
                if (err) return done(err);
                expect(res.text).to.have.string('Redirecting to /api/user/sign-in');
                console.log(res.headers['set-cookie']);
                done();
            });
    });

    it('can sign-in if email is verified', function (done) {

        var agent = request.agent();

        var newUser = {
            "email":"bob@example.com",
            "password" : "P@ssw0rd16"
        };

        Model.User.update(
            {
                activated: true
            },
            {
                where: {email: newUser.email}
            })
            .then(function () {
                server.post('/sign-in')
                    .send(newUser)
                    .expect(302)
                    .end(function (err, res) {
                        if (err) return done(err);
                        expect(res.text).to.have.string('Redirecting to /api/user/sign-in');
                        done();
                    });
            }).catch( function(error) {
                return done(error);
            });
    });
});
