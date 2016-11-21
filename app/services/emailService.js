/**
 * Created by preciousr on 21/01/2016.
 */
var request = require('request'),
    common = require('../../config/common.js'),
    envVariables = common.config();


emailService = {
    lockedOut: function(name,email){

        var url = '/account_locked';
        var postData= {to: email, name: name};

        // send request to notification service
        request(setOptions(postData, url), function (err, res, body) {
            if(err) {
                console.log(err);
            } else {
                console.log(res.statusCode, body);
            }
        });
    },
    resetPassword: function(email,token){

        var url = '/reset-password';
        var postData= {to: email, token: token};

        // send request to notification service
        request(setOptions(postData, url), function (err, res, body) {
            if(err) {
                console.log(err);
            } else {
                console.log(res.statusCode, body);
            }
        });
    },
    confirmPasswordChange: function(name,email){

        var url = '/password-updated';
        var postData= {to: email, name: name};

        // send request to notification service
        request(setOptions(postData, url), function (err, res, body) {
            if(err) {
                console.log(err);
            } else {
                console.log(res.statusCode, body);
            }
        });
    },
    emailConfirmation: function(email,token){

        var url = '/confirm-email';
        var postData= {to: email, token: token};

        // send request to notification service
        request(setOptions(postData, url), function (err, res, body) {
            if(err) {
                console.log(err);
            } else {
                console.log(res.statusCode, body);
            }
        });
    },
    expiryWarning: function(email, accountExpiryDateText, dayAndMonthText){
        
                    var url = '/expiry_warning';
                var postData= {to: email, accountExpiryDateText: accountExpiryDateText, dayAndMonthText: dayAndMonthText};
        
                    // send request to notification service
                        request(setOptions(postData, url), function (err, res, body) {
                                if(err) {
                                        console.log(err);
                                    } else {
                                        console.log(res.statusCode, body);
                                    }
                                return res.statusCode;
                            });
            },
    expiryConfirmation: function(email){
    
                var url = '/expiry_confirmation';
            var postData= {to: email};
    
                // send request to notification service
                    request(setOptions(postData, url), function (err, res, body) {
                            if(err) {
                                    console.log(err);
                                } else {
                                    console.log(res.statusCode, body);
                                }
                        });
        }
};

module.exports = emailService;

function setOptions(postData, url){
    var options = {
        url: envVariables.notificationServiceURL+url,
        headers:
        {
            'cache-control': 'no-cache',
            'content-type': 'application/json'
        },
        method: 'POST',
        json: true,
        body: postData
    };
    return options;
}
