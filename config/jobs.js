/**
 * Created by preciousr on 11/04/2016.
 */
var Model = require('../app/model/models.js'),
    common = require('./common.js'),
    envVariables = common.config();

var jobs ={
    accountExpiryCheck: function(){
    console.log("RUNNING ACCOUNT EXPIRY CHECK JOB");
        var now = new Date(),
        gracePeriod = new Date(now);

        gracePeriod.setDate(now.getDate()+envVariables.userAccountSettings.gracePeriod);
        Model.User.findAll().then(function(users){
                for(var u=0; u<users.length; u++){
                    var user = users[u],
                        expired = user.accountExpiry < now,
                        expiringSoon = user.accountExpiry < gracePeriod,
                        warningSent = user.warningSent,
                        expiryConfirmationSent = user.expiryConfirmationSent;
                    if(!expired && expiringSoon && !warningSent){
                        console.log('SEND WARNING EMAIL');
                        Model.User.update({warningSent:true}, {where:{email : user.email}});
                        emailService.expiryWarning(user.email);
                    }
                    else if(expired && !expiryConfirmationSent){
                        console.log('SEND EXPIRY EMAIL AND DELETE ACCOUNT');
                        Model.User.update({expiryConfirmationSent:true}, {where:{email : user.email}});
                        emailService.expiryConfirmation(user.email);
                        Model.AccountDetails.destroy({where:{user_id:user.id}});
                        Model.SavedAddress.destroy({where:{user_id:user.id}});
                        Model.User.destroy({where:{email:user.email}});
                    }
                }
            }
        )
    }
};
module.exports = jobs;