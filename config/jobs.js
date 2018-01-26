/**
 * Created by preciousr on 11/04/2016.
 */
var Model = require('../app/model/models.js'),
    common = require('./common.js'),
    moment = require('moment'),
    envVariables = common.config();

var jobs ={
    accountExpiryCheck: function(){
    console.log("[ACCOUNT CHECK JOB] STARTING");
        var now = new Date(),
        gracePeriod = new Date(now);
        gracePeriod.setDate(now.getDate()+envVariables.userAccountSettings.gracePeriod);
        Model.User.findAll({
            where: {
                accountExpiry: {
                    $lte: gracePeriod
                }
            }
        }).then(function(users){
            console.log('[ACCOUNT CHECK JOB] ACCOUNTS TO CHECK: ' + users.length);

                for(var u=0; u<users.length; u++){
                    setTimeout(function(u){

                            var user = users[u],
                                expired = user.accountExpiry < now,
                                expiringSoon = user.accountExpiry < gracePeriod,
                                warningSent = user.warningSent,
                                expiryConfirmationSent = user.expiryConfirmationSent,
                                accountExpiryDateText = moment(user.accountExpiry).format('Do MMMM YYYY'),
                                dayAndMonthText = moment(user.accountExpiry).format('Do MMMM');

                            console.log('[ACCOUNT CHECK JOB] PROCESSING USER ' + user.id);

                            if (!expired && expiringSoon && !warningSent) {
                                console.log('[ACCOUNT CHECK JOB] SENDING WARNING EMAIL FOR USER ' + user.id);

                                Model.User.update({warningSent: true}, {where: {email: user.email}}).then(function () {

                                    emailService.expiryWarning(user.email,accountExpiryDateText,dayAndMonthText, user.id);

                                });

                            }
                            else if (expired && !expiryConfirmationSent) {
                                console.log('[ACCOUNT CHECK JOB] SENDING EXPIRY EMAIL AND DELETE ACCOUNT FOR USER ' + user.id);

                                Model.User.update({expiryConfirmationSent: true}, {where: {email: user.email}}).then(function () {

                                    emailService.expiryConfirmation(user.email, user.id);

                                    Model.AccountDetails.destroy({where: {user_id: user.id}}).then(function () {
                                        Model.SavedAddress.destroy({where: {user_id: user.id}}).then(function () {
                                            Model.User.destroy({where: {email: user.email}}).then(function(){
                                                console.log('[ACCOUNT CHECK JOB] ACCOUNT DELETED SUCCESSFULLY FOR USER ' + user.id);
                                            });
                                        });
                                    });
                                });
                            } else {
                                console.log('[ACCOUNT CHECK JOB] NO ACTION REQUIRED FOR USER ' + user.id);
                            }

                    }, 1000 * u, u);
                }
            }
        )
    }
};
module.exports = jobs;