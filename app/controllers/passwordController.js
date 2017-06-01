/**
 * Created by preciousr on 07/01/2016.
 */

var async = require('async'),
    crypto = require('crypto'),
    unirest = require('unirest'),
    Model = require('../model/models.js'),
    common = require('../../config/common.js'),
    envVariables = common.config(),
    validator = require('validator'),
    ValidationService = require('../services/ValidationService.js');

module.exports.forgotPassword =  function(req, res) {
    async.waterfall([
        function(done) {
            //Create random reset token
            crypto.randomBytes(20, function(error, buf) {
                var token = buf.toString('hex');
                //Pass token on to the next function
                done(error, token);
            });
        },
        function(token, done) {
            //Find User
            req.body.email = req.body.email.toLowerCase();
            Model.User.findOne({
                where: {
                    'email': req.body.email
                }
            }).then(function (user) {
                var emailPattern = /\S+@\S+\.\S+/;

                if (!emailPattern.test(req.body.email)) {
                    console.info('Password reset requested. Invalid email pattern.');
                    return res.render('forgot', {message: "Please enter a valid email address."});
                }
                else  {
                    req.session.flash = '';
                    req.flash('info', "If an account matches " +  req.body.email + " we'll send you an email with instructions on how to reset your password.");
                }

                if (!user) {
                    console.info('Password reset requested. Email not found.');
                    return res.redirect('/api/user/sign-in');
                }
                //Create expiry variable for token expiration
                var expire = new Date();
                var expiryTime = (60*60*1000); //1 hour
                expire.setTime(expire.getTime()+expiryTime);// now +1 hour

                //Associate token and the token expiry with user
                Model.User.update({
                    resetPasswordToken: token,
                    resetPasswordExpires: expire
                }, {
                    where: {
                        email: req.body.email
                    }})
                    .then(function(){
                        console.info('Password reset requested.');
                        done(null,token);
                    });
            });

        },
        function(token, done){
            emailService.resetPassword(req.body.email,token);
            return done(null);

        }
    ], function() {
        return res.redirect('/api/user/sign-in');
    });
};

module.exports.resetPassword = function(req, res) {
    var reset = req.path!='/set-new-password';
    var patt = new RegExp(envVariables.password_settings.passwordPattern);

    var messages=[];
    var passwordErrorType=[];

    // check the password against the blacklists
    // location of the password blacklist and phraselist
    var blackList = require('../../config/blacklist.js');
    var phraselist = require('../../config/phraselist.js');
    //return true if password is in the blacklist
    var passwordInBlacklist = validator.isIn(req.body.password, blackList);
    // normalise the password by removing all spaces and converting to lower case
    var normalisedPassword = validator.blacklist(req.body.password, ' ').trim().toLowerCase();
    // check to see if a word in the phraselist appears in the normalised password
    var passwordInPhraselist = false;
    if (new RegExp(phraselist.join("|")).test(normalisedPassword)) {
        passwordInPhraselist = true;
    }

    if (passwordInBlacklist | passwordInPhraselist) {
        messages.push("Change the words in your password - don't include any commonly used words that are easy to guess. \n");
    }

    if (passwordInBlacklist) {
        passwordErrorType.push("blacklist");
    }

    if (passwordInPhraselist) {
        passwordErrorType.push("phraselist");
    }

    if (req.body.password === '') {
        messages.push("Enter a password \n");
    } else {
        if(!patt.test(req.body.password)) messages.push("Your password must be at least 8 characters long and must contain at least 1 lowercase letter, 1 capital letter and 1 number\n");
        else if(req.body.password.length < 8) messages.push("Enter a password ensuring it is at least 8 characters long and contains at least 1 lowercase letter, 1 capital letter and 1 number \n");
        else if(req.body.password.length > 16) messages.push("Enter a password ensuring it is at most 16 characters long and contains at least 1 lowercase letter, 1 capital letter and 1 number \n");
    }

    if(req.body.password != req.body.confirm_password) messages.push("Passwords did not match \n");


    if(messages.length>0){
        return res.render(reset ? 'reset.ejs' : 'set-new-password.ejs', {
            error:  messages,
            passwordErrorType: passwordErrorType,
            resetPasswordToken: req.params.token
        });
    }
    else {
        async.waterfall([
            function (done) {
                //Find User with the password token which has not expired
                var where = reset ?
                { where: {
                    resetPasswordToken: req.params.token,
                    resetPasswordExpires: {$gt: new Date()}
                }}
                    :
                {where: {
                    email : req.session.email
                }};

                Model.User.findOne(where)
                    .then(function (user, error) {
                        if (!user && reset) {
                            req.flash('error', 'Password reset token is invalid or has expired.');
                            return res.redirect('back');
                        }

                        //Hash the new password
                        var bcrypt = require('bcryptjs');
                        var salt = bcrypt.genSaltSync(10);
                        var password= req.body.password, confirm_password= req.body.confirm_password;
                        var hashedPassword = password!==null && password!== '' ? bcrypt.hashSync(password, salt) : '';
                        var hashedConfirmPassword = confirm_password!==null && confirm_password!== '' ? bcrypt.hashSync(confirm_password, salt) : '';
                        function password_expiry (date, days) {
                            var result = new Date(date);
                            result.setDate(result.getDate() + days);
                            return result;
                        }
                        //Check that password is different from old password
                        if(user.password == bcrypt.hashSync(password, user.salt) ){
                            return res.render(reset ? 'reset.ejs' : 'set-new-password.ejs', {
                                error:  ["Your new password must be different from your last password."],
                                resetPasswordToken: req.params.token
                            });
                        }

                        //Update the user with the new the password and its salt and also remove the token information.
                        Model.User.update({
                            password: hashedPassword,
                            confirm_password: hashedConfirmPassword,
                            salt: salt,
                            resetPasswordToken: '',
                            resetPasswordExpires: null,
                            failedLoginAttemptCount: 0,
                            accountLocked:false,
                            passwordExpiry: password_expiry(new Date(),envVariables.password_settings.passwordExpiryInDays),
                            activated: true
                        }, {
                            where: {email: user.email}
                        })
                            .then(function () {
                                console.info('Password reset requested. Change successful.');
                                emailService.confirmPasswordChange(user.first_name, user.email);
                                done(user);

                            });
                        done(user);
                    });

            },
            function ( user, done) {

                done(null);


            }
        ], function () {
            return res.redirect((reset ? '/api/user/sign-in' : '/api/user/dashboard'));

        });
    }
};