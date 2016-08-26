/**
 * Created by preciousr on 11/04/2016.
 */
var Model = require('../app/model/models.js');

var jobs ={
    accountExpiryCheck: function(){
        //Dates
        var now = new Date(),
            aWeekLater = new Date(now),
            aYearLater= new Date(now);
        aWeekLater.setDate(now.getDate()+7);

        Model.User.findAll().then(function(users){
                for(var u=0; u<users.length; u++){
                    var user = users[u];
                    var expired = user.accountExpiry < now;
                    var expiringThisWeek = user.accountExpiry < aWeekLater;
                    var warningSent = user.warningSent;
                    var expiryConfirmationSent = user.expiryConfirmationSent;
                    var readyToDelete = aYearLater.setFullYear(user.accountExpiry.getFullYear()+1) < now;

                    if(!expired && expiringThisWeek && !warningSent){
                        console.log('SEND WARNING EMAIL');
                        Model.User.update({warningSent:true}, {where:{email : user.email}});
                        emailService.expiryWarning(user.email);
                    }
                    else if(expired && !expiryConfirmationSent){
                        console.log('SEND EXPIRY CONFIRMATION EMAIL AND DELETE');
                        Model.User.update({expiryConfirmationSent:true}, {where:{email : user.email}});
                        emailService.expiryConfirmation(user.email);
                        //Model.AccountDetails.destroy({where:{user_id:user.id}});
                        // Model.SavedAddress.destroy({where:{user_id:user.id}});
                        //Model.User.destroy({where:{email:user.email}});
                    }


                }
            }
        )
    }
};
module.exports = jobs;