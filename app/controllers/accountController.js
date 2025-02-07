const emailService = require("../services/emailService");
const config = require('../../config/environment');
const Model = require('../model/models.js');
const ValidationService = require('../services/ValidationService.js'),  common = require('../../config/common.js');
const envVariables = common.config();
const axios = require('axios');
const moment = require("moment");
const oneTimePasscodeService = require("../services/oneTimePasscodeService");
const HelperService = require("../services/HelperService");
const mobilePattern = /^(\+|\d|\(|\#| )(\+|\d|\(| |\-)([0-9]|\(|\)| |\-){5,14}$/;
const phonePattern = /^(\+|\d|\(|\#| )(\+|\d|\(| |\-)([0-9]|\(|\)| |\-){5,14}$/;
const crypto = require('crypto');
const util = require('util');
const {Op} = require("sequelize");
const randomBytes = util.promisify(crypto.randomBytes);

async function sendToOrbit(accountManagementObject, user) {
    try {
        const edmsManagePortalCustomerUrl = config.edmsHost + '/api/v1/managePortalCustomer';
        const edmsBearerToken = await HelperService.getEdmsAccessToken();
        const startTime = new Date();

        const response = await axios.post(edmsManagePortalCustomerUrl, accountManagementObject, {
            headers: {
                'content-type': 'application/json',
                Authorization: `Bearer ${edmsBearerToken}`,
            },
        });

        const endTime = new Date();
        const elapsedTime = endTime - startTime;

        if (response.status === 200) {
            console.log(
                '[ACCOUNT MANAGEMENT] ACCOUNT UPDATE SENT TO ORBIT SUCCESSFULLY FOR USER_ID ' +
                user.id
            );
        } else {
            console.error(
                '[ACCOUNT MANAGEMENT] ACCOUNT UPDATE FAILED SENDING TO ORBIT FOR USER_ID ' +
                user.id
            );
            console.error('response code: ' + response.status);
            console.error(response.data);
        }

        console.log(`Orbit account management request response time: ${elapsedTime}ms`);
    } catch (error) {
        console.error(`sendToOrbit: ${error}`);
    }
}

module.exports.showAccount = async function(req, res) {
    try {
        const user = await Model.User.findOne({ where: { email: req.session.email } });
        if (!user) {
            throw new Error('User not found');
        }

        const account = await Model.AccountDetails.findOne({ where: { user_id: user.id } });
        if (!account) return res.redirect('/api/user/complete-details');

        return res.render('account_pages/account.ejs', {
            user: user,
            account: account,
            url: envVariables,
            info: req.flash('info'),
            company_info: req.flash('company_info')
        });

    } catch (error) {
        console.error(`showAccount: ${error}`)
        return res.render('generic-error.ejs', {
            backLink: '#',
            error
        })
    }
};

module.exports.showAdminSection = async function(req, res) {
    try {
        return res.render('account_pages/admin.ejs', {
            user: req?.session?.user,
            account: req?.session?.account,
            url: envVariables,
            info: req.flash('info'),
            error: null
        });

    } catch (error) {
        console.error(`showAdminSection: ${error}`)
        return res.render('generic-error.ejs', {
            backLink: '#',
            error
        })
    }
};

module.exports.showAdminSearchEmail = async function(req, res) {
    try {
        return res.render('account_pages/admin.ejs', {
            user: req?.session?.user,
            account: req?.session?.account,
            url: envVariables,
            info: req.flash('info'),
            error: null
        });

    } catch (error) {
        console.error(`showAdminSearchEmail: ${error}`)
        return res.render('generic-error.ejs', {
            backLink: '#',
            error
        })
    }
};

module.exports.ajaxSearchEmail = async function(req, res) {
    try {
        const emailQuery = req.query.email;

        if (!emailQuery || emailQuery.length < 3) {
            return res.json([]);
        }

        const users = await Model.User.findAll({
            where: {
                email: { [Op.like]: `%${emailQuery}%` }
            },
            attributes: ["id", "email"],
            order: [["email", "ASC"]]
        });

        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.adminSearchEmail = async function(req, res) {
    try {

        const user = req?.session?.user;
        if (!user) {
            throw new Error('User not found');
        }
        const account = req?.session?.account;
        if (!account) {
            throw new Error('Account not found');
        }

        let emailToSearchFor = req.body.searchEmail.trim();
        if (!emailToSearchFor) {
            return res.render('account_pages/admin.ejs', {
                user,
                account,
                url: envVariables,
                info: req.flash('info'),
                error: `Please enter an email address`,
            });
        }

        const searchResults = await Model.User.findOne({ where: { email: emailToSearchFor } });

        return res.render('account_pages/admin-search-email.ejs', {
            user,
            account,
            searchResults,
            url: envVariables,
            info: req.flash('info')
        });

    } catch (error) {
        console.error(`adminSearchEmail: ${error}`)
        return res.render('generic-error.ejs', {
            backLink: req.get('Referer'),
            error
        })
    }
};

module.exports.showUpdatePermissions = async function(req, res) {
    try {
        return res.render('account_pages/admin.ejs', {
            user: req?.session?.user,
            account: req?.session?.account,
            url: envVariables,
            info: req.flash('info'),
            error: null
        });

    } catch (error) {
        console.error(`showAdminSearchEmail: ${error}`)
        return res.render('generic-error.ejs', {
            backLink: '#',
            error
        })
    }
};

module.exports.updatePermissions = async function(req, res) {
    try {
        let accountLocked = req.body.accountLocked === "true" || false;
        let dropOffEnabled = req.body.dropOffEnabled === "true" || false;
        let premiumServiceEnabled = req.body.premiumServiceEnabled === "true" || false;

        const user = req?.session?.user;
        if (!user) {
            throw new Error('User not found');
        }

        const account = req?.session?.account;
        if (!account) {
            throw new Error('Account not found');
        }

        // userId and email of the account being edited
        const userId = req.body.userId;
        const email = req.body.email;
        if (!userId) {
            throw new Error("No userId provided");
        }

        // Fetch the existing user details before updating (for logging purposes)
        const existingUser = await Model.User.findByPk(userId);

        if (!existingUser) {
            throw new Error(`User with ID ${userId} not found.`);
        }

        // Store changes for logging
        let changes = [];
        if (existingUser.accountLocked !== accountLocked) {
            changes.push(`Account Locked: ${existingUser.accountLocked} → ${accountLocked}`);
        }
        if (existingUser.dropOffEnabled !== dropOffEnabled) {
            changes.push(`Next-Day Service: ${existingUser.dropOffEnabled} → ${dropOffEnabled}`);
        }
        if (existingUser.premiumServiceEnabled !== premiumServiceEnabled) {
            changes.push(`Urgent Service: ${existingUser.premiumServiceEnabled} → ${premiumServiceEnabled}`);
        }

        await Model.User.update(
            { accountLocked, dropOffEnabled, premiumServiceEnabled },
            { where: { id: userId } }
        );

        req.flash('info', `${email} has been updated successfully`);

        // Log the update only if there were changes
        if (changes.length > 0) {
            console.info(`[UPDATE PERMISSIONS] ${user.email} UPDATED ${email}: ${changes.join(", ")}`);
        }

        return res.render('account_pages/admin.ejs', {
            user,
            account,
            url: envVariables,
            info: req.flash('info'),
            error: null
        });

    } catch (error) {
        console.error(`updatePermissions: ${error}`);
        return res.render('generic-error.ejs', {
            backLink: req.get('Referer'),
            error
        });
    }
};


module.exports.showAddresses = async function(req, res) {
        try {
            const user = await Model.User.findOne({ where: { email: req.session.email } });
            if (!user) {
                throw new Error('User not found');
            }

            const account = await Model.AccountDetails.findOne({ where: { user_id: user.id } });
            if (!account) {
                throw new Error('Account not found');
            }

            const addresses = await Model.SavedAddress.findAll({ where: { user_id: user.id }, order: [['id', 'ASC']] });

            return res.render('account_pages/addresses.ejs', {
                user: user,
                account: account,
                url: envVariables,
                addresses: addresses,
                info: req.flash('info')
            });
        } catch (error) {
            console.error(`showAddresses: ${error}`)
            return res.render('generic-error.ejs', {
                backLink: '/api/user/account',
                error
            })
        }
};


module.exports.showChangeDetails = async function(req, res) {
    try {
        const user = await Model.User.findOne({ where: { email: req.session.email } });
        if (!user) {
            throw new Error('User not found');
        }

        const account = await Model.AccountDetails.findOne({ where: { user_id: user.id } });

        if (!account) {
            throw new Error('Account not found');
        }

        let mfaPreference = user.mfaPreference;
        let disableMobileNumberEditing = (mfaPreference === 'SMS');

        return res.render('account_pages/change-details.ejs', {
            error_report: false,
            form_values: account,
            url: envVariables,
            disableMobileNumberEditing: disableMobileNumberEditing
        });
    } catch (error) {
        console.error(`showChangeDetails: ${error}`)
        return res.render('generic-error.ejs', {
            backLink: '/api/user/account',
            error
        })
    }
};


module.exports.changeDetails = async function(req, res) {

    try {
        const user = await Model.User.findOne({ where: { email: req.session.email } });
        if (!user) {
            throw new Error('User not found');
        }

        const data = await Model.AccountDetails.findOne({ where: { user_id: user.id } });

        let accountDetails = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            mobileNo: mobilePattern.test(req.body.mobileNo) ? req.body.mobileNo : '',
            telephone: (req.body.telephone !== '') ? phonePattern.test(req.body.telephone) ? req.body.telephone : '' : null,
            feedback_consent: req.body.feedback_consent || ''
        };

        if (data) {
            let companyName = (user.premiumServiceEnabled) ? data.company_name : "";

            if (user.mfaPreference === 'SMS') {
                accountDetails.mobileNo = data.mobileNo;
            }

            await Model.AccountDetails.update(accountDetails, { where: { user_id: user.id } });

            var accountManagementObject = {
                "portalCustomerUpdate": {
                    "userId": "legalisation",
                    "timestamp": (new Date()).getTime().toString(),
                    "portalCustomer": {
                        "portalCustomerId": user.id,
                        "forenames": accountDetails.first_name,
                        "surname": accountDetails.last_name,
                        "primaryTelephone": accountDetails.telephone,
                        "mobileTelephone": accountDetails.mobileNo,
                        "eveningTelephone": "",
                        "email": req.session.email,
                        "companyName": companyName,
                        "companyRegistrationNumber": ''
                    }
                }
            };

            sendToOrbit(accountManagementObject, user);
            return res.redirect('/api/user/account');
        } else {
            await Model.AccountDetails.create(accountDetails);
            return res.redirect('/api/user/account');
        }
    } catch (error) {

        const user = await Model.User.findOne({ where: { email: req.session.email } });
        if (!user) {
            throw new Error('User not found');
        }

        const data = await Model.AccountDetails.findOne({ where: { user_id: user.id } });

        let erroneousFields = [];

        if (req.body.first_name === '') {
            erroneousFields.push('first_name');
        }
        if (req.body.last_name === '') {
            erroneousFields.push('last_name');
        }
        if (typeof req.body.feedback_consent === 'undefined') {
            erroneousFields.push('feedback_consent');
        }
        if (req.body.telephone !== '' && typeof req.body.telephone !== 'undefined') {
            if (req.body.telephone === '' || req.body.telephone.length < 6 || req.body.telephone.length > 25 || !phonePattern.test(req.body.telephone)) {
                erroneousFields.push('telephone');
            }
        }
        if (req.body.mobileNo !== '' && typeof req.body.mobileNo !== 'undefined') {
            if (req.body.mobileNo === '' || req.body.mobileNo.length < 6 || req.body.mobileNo.length > 25 || !mobilePattern.test(req.body.mobileNo)) {
                erroneousFields.push('mobileNo');
            }
        } else req.body.mobileNo = data.mobileNo;

        const disableMobileNumberEditing = (user.mfaPreference === 'SMS');

        return res.render('account_pages/change-details.ejs', {
            error_report: ValidationService.validateForm({ error: error, erroneousFields: erroneousFields }),
            form_values: req.body,
            url: envVariables,
            disableMobileNumberEditing: disableMobileNumberEditing
        });
    }
};



module.exports.showChangePassword = function(req, res) {
    return res.render('account_pages/change-password.ejs', {error:false, url:envVariables});
};

module.exports.changePassword = async function(req, res) {
    try {
        const buf = await randomBytes(20);
        const token = buf.toString('hex');
        const expire = new Date();
        const expiryTime = (60 * 60 * 1000); // 1 hour
        expire.setTime(expire.getTime() + expiryTime); // now +1 hour

        // Associate token and the token expiry with user
        await Model.User.update({
            resetPasswordToken: token,
            resetPasswordExpires: expire
        }, {
            where: {
                email: req.session.email
            }
        });

        await emailService.resetPassword(req.session.email, token);
        req.flash('info', "We've sent you an email with instructions on how to reset your password.");
        return res.redirect('/api/user/account');
    } catch (error) {
        console.error(`changePassword: ${error}`)
        return res.render('generic-error.ejs', {
            backLink: '/api/user/account',
            error
        })
    }
};

module.exports.showChangeMfa = async function(req, res) {
    try {
        const user = await Model.User.findOne({ where: { email: req.session.email } });
        if (!user) throw new Error('User not found');

        const account = await Model.AccountDetails.findOne({ where: { user_id: user.id } });
        if (!account) throw new Error('Account details not found');

        return res.render('account_pages/change-mfa.ejs', {
            error: false,
            errorsArray: null,
            url: envVariables,
            mfaPreference: user.mfaPreference,
            mobileNo: account.mobileNo
        });
    } catch (error) {
        console.error(`showChangeMfa: ${error}`)
        return res.render('generic-error.ejs', {
            backLink: '/api/user/account',
            error
        })
    }
};


module.exports.changeMfa = async function(req, res) {
    try {
        const user = await Model.User.findOne({ where: { email: req.session.email } });
        if (!user) throw new Error('User not found');

        const account = await Model.AccountDetails.findOne({ where: { user_id: user.id } });
        if (!account) throw new Error('Account details not found');

        let mfaPreference = req.body['mfaPreference'];
        let mobileNoFromForm = req.body['mobileNo'];
        let mobileNoFromDB = account.mobileNo;
        let mobileNoDiffers = (mobileNoFromForm !== mobileNoFromDB);

        let errorsArray = [];

        // Don't need to change anything if the user is trying to
        // select the MFA method they are already using
        if ((mfaPreference === 'Email' && user.mfaPreference === 'Email') || (mfaPreference === 'SMS' && user.mfaPreference === 'SMS' && !mobileNoDiffers)) {
            return res.redirect('/api/user/account');
        }

        if (mfaPreference === 'Email') {
            await Model.User.update({ mfaPreference: mfaPreference }, { where: { email: req.session.email } });
            req.flash('info', 'Your MFA preference has been updated to Email.');
            return res.redirect('/api/user/account');
        } else {
            let validMobile = mobilePattern.test(mobileNoFromForm) ? mobileNoFromForm : false;

            if (validMobile !== false) {
                // One-time passcodes expire 10 mins after being issued
                let oneTimePasscodeExists = await oneTimePasscodeService.checkIfOneTimePasscodeExists(user.id);

                if (oneTimePasscodeExists) {
                    // If the one-time passcode for the user is old, we need to delete it and generate a new one
                    if (moment(Date.parse(oneTimePasscodeExists.passcode_expiry)).isBefore(Date.now())) {
                        await oneTimePasscodeService.deleteOneTimePasscode(user.id);
                        let one_time_passcode = await oneTimePasscodeService.generateOneTimePasscode();
                        await oneTimePasscodeService.storeNewOneTimePasscode(user.id, one_time_passcode);
                        await emailService.sendOneTimePasscodeSMS(one_time_passcode, validMobile, user.id);
                    }
                } else {
                    let one_time_passcode = await oneTimePasscodeService.generateOneTimePasscode();
                    await oneTimePasscodeService.storeNewOneTimePasscode(req.user.id, one_time_passcode);
                    await emailService.sendOneTimePasscodeSMS(one_time_passcode, validMobile, req.user.id);
                }

                return res.render('account_pages/validate-sms-totp', {
                    error: false,
                    errorsArray: null,
                    back_link: '/api/user/change-mfa',
                    info: req.flash('info'),
                    mobileNo: validMobile
                });
            } else {
                errorsArray.push({
                    fieldName: 'mobileNo',
                    fieldError: 'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192'
                });
                return res.render('account_pages/change-mfa.ejs', {
                    error: true,
                    errorsArray: errorsArray,
                    url: envVariables,
                    mfaPreference: user.mfaPreference,
                    mobileNo: account.mobileNo
                });
            }
        }
    } catch (error) {
        console.error(`changeMfa: ${error}`)
        return res.render('generic-error.ejs', {
            backLink: '/api/user/change-mfa',
            error
        })
    }
};

module.exports.showValidateSMS = async function(req, res) {

    let user_id = req.session.passport.user
    let mobileNoFromForm = req.body['mobileNo']
    let accountData = await oneTimePasscodeService.getAccountData(user_id)

    if (req.query.resendPasscode === 'true') {

        let one_time_passcode = await oneTimePasscodeService.generateOneTimePasscode()
        await oneTimePasscodeService.deleteOneTimePasscode(user_id)
        await oneTimePasscodeService.storeNewOneTimePasscode(user_id, one_time_passcode)
        await emailService.sendOneTimePasscodeSMS(one_time_passcode, accountData.mobileNo, user_id)
        req.flash('info', 'We have sent you another passcode via SMS.')
        res.render('account_pages/validate-sms-totp', {
            error: false,
            errorsArray: null,
            back_link: '/api/user/change-mfa',
            info: req.flash('info'),
            mobileNo: mobileNoFromForm
        });

    } else {

        res.render('account_pages/validate-sms-totp', {
            error: false,
            errorsArray: null,
            back_link: '/api/user/change-mfa',
            info: req.flash('info'),
            mobileNo: mobileNoFromForm
        });

    }

};

module.exports.validateSMS = async function (req, res) {

    let passcode = req.body.passcode
    let mobileNoFromForm = req.body['mobileNo']
    let user_id = req.session.passport.user
    let errorsArray = [];

    async function validateFormInput(passcode) {

        if (passcode.length === 0) {
            errorsArray.push({
                fieldName: 'passcode',
                fieldError: 'Please enter a passcode'
            })
        } else if (passcode.length !== 6) {
            errorsArray.push({
                fieldName: 'passcode',
                fieldError: 'Please enter a 6 digit passcode'
            })
        }

        return errorsArray.length === 0;

    }

    let noErrorsPresent = await validateFormInput(passcode)

    if (noErrorsPresent) {

        let verificationIsSuccessful = await oneTimePasscodeService.verifyUser(user_id, passcode)

        if (verificationIsSuccessful) {
            await oneTimePasscodeService.deleteOneTimePasscode(user_id)
            await oneTimePasscodeService.updateMfaPreferenceToSMS(user_id)
            await oneTimePasscodeService.updateAccountMobileNumber(user_id, mobileNoFromForm)

            req.flash('info', 'Your MFA preference has been updated to SMS.');
            res.redirect('/api/user/account')
        } else {
            errorsArray.push({
                fieldName: 'passcode',
                fieldError: 'The passcode you entered was incorrect'
            })

            return res.render('account_pages/validate-sms-totp', {
                error:true,
                errorsArray: errorsArray,
                back_link: '/api/user/change-mfa',
                info: req.flash('info'),
                mobileNo: mobileNoFromForm
            });
        }

    } else {

        return res.render('account_pages/validate-sms-totp', {
            error: true,
            errorsArray: errorsArray,
            info: req.flash('info'),
            back_link: '/api/user/change-mfa',
            mobileNo: mobileNoFromForm
        })
    }

};

module.exports.showChangeCompanyDetails = async function(req, res) {
    try {
        const user = await Model.User.findOne({ where: { email: req.session.email } });
        if (!user) throw new Error('User not found');

        const account = await Model.AccountDetails.findOne({ where: { user_id: user.id } });
        if (!account) throw new Error('Account not found');

        return res.render('account_pages/change-company-details.ejs', {
            error_report: false,
            form_values: account,
            url: envVariables
        });
    } catch (error) {
        console.error(`showChangeCompanyDetails: ${error}`)
        return res.render('generic-error.ejs', {
            backLink: '/api/user/account',
            error
        })
    }
};


module.exports.changeCompanyDetails = async function(req, res) {
    const accountDetails = {
        company_name: req.body.company_name
    };

    try {
        const user = await Model.User.findOne({ where: { email: req.session.email } });
        if (!user) throw new Error('User not found');

        const data = await Model.AccountDetails.findOne({ where: { user_id: user.id } });

        if (data) {
            await Model.AccountDetails.update(accountDetails, { where: { user_id: user.id } });

            const accountManagementObject = {
                "portalCustomerUpdate": {
                    "userId": "legalisation",
                    "timestamp": (new Date()).getTime().toString(),
                    "portalCustomer": {
                        "portalCustomerId": user.id,
                        "forenames": data.first_name,
                        "surname": data.last_name,
                        "primaryTelephone": data.telephone,
                        "mobileTelephone": data.mobileNo,
                        "eveningTelephone": "",
                        "email": req.session.email,
                        "companyName": req.body.company_name,
                        "companyRegistrationNumber": data.company_number
                    }
                }
            };

            sendToOrbit(accountManagementObject, user);
            return res.redirect('/api/user/account');
        } else {
            await Model.AccountDetails.create(accountDetails);
            return res.redirect('/api/user/account');
        }
    } catch (error) {

        const erroneousFields = [];
        if (req.body.company_name === '') {
            erroneousFields.push('company_name');
        }

        return res.render('account_pages/change-company-details.ejs', {
            error_report: ValidationService.validateForm({ error: error, erroneousFields: erroneousFields }),
            form_values: req.body,
            url: envVariables
        });
    }
};



module.exports.changeEmail = async function(req, res) {
    return res.render('account_pages/change-email.ejs');
};
