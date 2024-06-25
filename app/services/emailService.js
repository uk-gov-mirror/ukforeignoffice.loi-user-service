const axios = require('axios');
const common = require('../../config/common.js');
const envVariables = common.config();

const emailService = {
    sendOneTimePasscodeEmail: async function(oneTimePasscode, email, userId) {
        const url = '/one_time_passcode_email';
        const postData = { to: email, oneTimePasscode: oneTimePasscode };
        const options = setOptions(postData, url);

        try {
            const response = await axios.post(options.url, options.body, { headers: options.headers });
            console.log(`${response.status} - One time passcode email sent for user ${userId}`);
        } catch (err) {
            console.log(err);
        }
    },
    sendOneTimePasscodeSMS: async function(oneTimePasscode, phoneNumber, userId) {
        const url = '/one_time_passcode_sms';
        const postData = { to: phoneNumber, oneTimePasscode: oneTimePasscode };
        const options = setOptions(postData, url);

        try {
            const response = await axios.post(options.url, options.body, { headers: options.headers });
            console.log(`${response.status} - One time passcode SMS sent for user ${userId}`);
        } catch (err) {
            console.log(err);
        }
    },
    lockedOut: async function(name, email) {
        const url = '/account_locked';
        const postData = { to: email, name: name };
        const options = setOptions(postData, url);

        try {
            const response = await axios.post(options.url, options.body, { headers: options.headers });
            console.log(`${response.status} - lockedOut email sent`);
        } catch (err) {
            console.log(err);
        }
    },
    resetPassword: async function(email, token) {
        const url = '/reset-password';
        const postData = { to: email, token: token };
        const options = setOptions(postData, url);

        try {
            const response = await axios.post(options.url, options.body, { headers: options.headers });
            console.log(`${response.status} - reset password email sent`);
        } catch (err) {
            console.log(err);
        }
    },
    confirmPasswordChange: async function(name, email) {
        const url = '/password-updated';
        const postData = { to: email, name: name };
        const options = setOptions(postData, url);

        try {
            const response = await axios.post(options.url, options.body, { headers: options.headers });
            console.log(`${response.status} - confirm password email sent`);
        } catch (err) {
            console.log(err);
        }
    },
    emailConfirmation: async function(email, token) {
        const url = '/confirm-email';
        const postData = { to: email, token: token };
        const options = setOptions(postData, url);

        try {
            const response = await axios.post(options.url, options.body, { headers: options.headers });
            console.log(`${response.status} - activation email sent`);
        } catch (err) {
            console.log(err);
        }
    },
    expiryWarning: async function(email, accountExpiryDateText, dayAndMonthText, userID) {
        const url = '/expiry_warning';
        const postData = { to: email, accountExpiryDateText: accountExpiryDateText, dayAndMonthText: dayAndMonthText };
        const options = setOptions(postData, url);

        try {
            const response = await axios.post(options.url, options.body, { headers: options.headers });
            console.log('[USER CLEANUP JOB] WARNING EMAIL SENT SUCCESSFULLY FOR USER ' + userID);
        } catch (err) {
            console.log(err);
        }
    },
    expiryConfirmation: async function(email, userID) {
        const url = '/expiry_confirmation';
        const postData = { to: email };
        const options = setOptions(postData, url);

        try {
            const response = await axios.post(options.url, options.body, { headers: options.headers });
            console.log('[USER CLEANUP JOB] EXPIRY EMAIL SENT SUCCESSFULLY FOR USER ' + userID);
        } catch (err) {
            console.log(err);
        }
    },
    requestBusinessAccess: async function(emailData) {
        const url = '/request-business-access';
        const options = setOptions(emailData, url);

        try {
            const response = await axios.post(options.url, options.body, { headers: options.headers });
            console.log('BUSINESS SERVICE APPLICATION REQUEST SENT SUCCESSFULLY FOR USER ' + emailData.userID);
        } catch (err) {
            console.log(err);
        }
    },
    businessServiceDecision: async function(emailData, decision) {
        const url = '/business-service-decision';
        const postData = { to: emailData.email, decision: decision };
        const options = setOptions(postData, url);

        try {
            const response = await axios.post(options.url, options.body, { headers: options.headers });
            if (decision === 'approve') {
                console.log('BUSINESS SERVICE ACCESS APPROVAL EMAIL SENT SUCCESSFULLY FOR USER ' + emailData.id);
            } else {
                console.log('BUSINESS SERVICE ACCESS REJECTION EMAIL SENT SUCCESSFULLY FOR USER ' + emailData.id);
            }
        } catch (err) {
            console.log(err);
        }
    }
};

module.exports = emailService;

function setOptions(postData, url) {
    return {
        url: envVariables.notificationServiceURL + url,
        headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/json'
        },
        method: 'POST',
        body: postData
    };
}