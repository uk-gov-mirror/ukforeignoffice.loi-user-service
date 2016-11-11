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
        aWeekLater = new Date(now);

        aWeekLater.setDate(now.getDate()+7);

        Model.User.findAll().then(function(users){
                for(var u=0; u<users.length; u++){
                    var user = users[u],
                        expired = user.accountExpiry < now,
                        expiringThisWeek = user.accountExpiry < aWeekLater,
                        warningSent = user.warningSent,
                        expiryConfirmationSent = user.expiryConfirmationSent,
                        diffTime = now.getTime() - user.accountExpiry.getTime(),
                        diffDays = Math.round(Math.abs(diffTime/(1000*60*60*24))),
                        readyToDelete = diffDays > envVariables.daysBeforeAccountIsDeleted;

                    if(!expired && expiringThisWeek && !warningSent){
                        console.log('SEND WARNING EMAIL');
                        Model.User.update({warningSent:true}, {where:{email : user.email}});
                        emailService.expiryWarning(user.email);
                    }
                    else if(expired && !expiryConfirmationSent){
                        console.log('SEND EXPIRY EMAIL');
                        Model.User.update({expiryConfirmationSent:true}, {where:{email : user.email}});
                        emailService.expiryConfirmation(user.email);
                        
                    }
                    else if(expired && expiryConfirmationSent && readyToDelete){
                        console.log('DELETE USER ACCOUNT');
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