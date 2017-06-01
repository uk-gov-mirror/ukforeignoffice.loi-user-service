/**
 * Created by preciousr on 22/02/2016.
 */

$(function () {
//2.1 Registration
    //Event category: Reg 01 - do you have an account already?
    $('#has-account').bind('submit', function (e) {

        if ($('input[name=has-account]:checked', '#has-account').val() == "true") {
            _paq.push(['trackEvent', 'Reg 01 - do you have an account already?', 'Yes']);
        } else {
            _paq.push(['trackEvent', 'Reg 01 - do you have an account already?', 'No']);
        }
        e.preventDefault();
        this.submit();
    });

    //Event category: Password 01 - Blacklist checks
    $(document).ready(function () {
        if ($('#blacklist').length){
            console.log("inside blacklist");
            _paq.push(['trackEvent', 'Password 01 - Blacklist checks', 'Password blocked by exact match list']);
        }
    });

    $(document).ready(function () {
        if ($('#phraselist').length){
            console.log("inside phraselist");
            _paq.push(['trackEvent', 'Password 01 - Blacklist checks', 'Password blocked by phrase match list']);
        }
    });

    $(document).ready(function () {
        if ($('#bothlists').length){
            console.log("inside phraselist and blacklist");
            _paq.push(['trackEvent', 'Password 01 - Blacklist checks', 'Password blocked by exact match list']);
            _paq.push(['trackEvent', 'Password 01 - Blacklist checks', 'Password blocked by phrase match list']);
        }
    });

    //Event category: Reg 02 - business signup? AND
    //Event category: Reg 03 - submit registration
    $('#register-form').bind('submit', function (e) {

        if ($('input[name=business_yes_no]:checked', '#register-form').val() == "Yes") {
            _paq.push(['trackEvent', 'Reg 02 - business signup?', 'Yes']);
            _paq.push(['trackEvent', 'Reg 03 - submit registration', 'Premium business registration submitted']);
        } else {
            _paq.push(['trackEvent', 'Reg 02 - business signup?', 'No']);
            _paq.push(['trackEvent', 'Reg 03 - submit registration', 'Standard registration submitted']);
        }
        e.preventDefault();
        this.submit();
    });

    //Event category: Reg 04 - verify email address
    $('#resend-confirm').bind('submit', function (e) {
        _paq.push(['trackEvent', 'Reg 04 - verify email address', 'Submit request for another email verification link']);

        e.preventDefault();
        this.submit();
    });

    //Event category: Reg 05 - complete account set up interactions
    $('#complete-registration-form').bind('submit', function (e) {
        _paq.push(['trackEvent', 'Reg 05 - complete account set up interactions', 'Added personal details']);

        e.preventDefault();
        this.submit();
    });

    //Event category: Reg 05 - complete account set up interactions
    $('#initial-skip').bind('click', function () {
        _paq.push(['trackEvent', 'Reg 05 - complete account set up interactions', 'Skipped adding address']);
    });
    //Event category: Account 01 - sign in
    $('#sign-in').bind('submit', function (e) {
        _paq.push(['trackEvent', 'Account 01 - sign in', 'User signed in']);

        e.preventDefault();
        this.submit();
    });

    //Account 02 in service code

    //Event category: Account 03 - account page interactions
    $('#change-details').bind('submit', function (e) {
        _paq.push(['trackEvent', 'Account 03 - account page interactions', 'submit update to personal details']);
        e.preventDefault();
        this.submit();
    });
    $('#change-company-details').bind('submit', function (e) {
        _paq.push(['trackEvent', 'Account 03 - account page interactions', 'submit update to company details']);
        e.preventDefault();
        this.submit();
    });
    $('#upgrade-account').bind('submit', function (e) {
        _paq.push(['trackEvent', 'Account 03 - account page interactions', 'upgrade from personal to business account']);
        e.preventDefault();
        this.submit();
    });

    //Event category: Account 04 - addresses page interactions
    $('#address_form').bind('submit', function (e) {
        if ($('input[name=initial]', '#address_form').val() == "true") {
            _paq.push(['trackEvent', 'Reg 05 - complete account set up interactions', 'Added address']);
        }else {
            _paq.push(['trackEvent', 'Account 04 - addresses page interactions', 'Add address']);
        }
        e.preventDefault();
        this.submit();
    });
    $('#edit_address_form').bind('submit', function (e) {
        _paq.push(['trackEvent', 'Account 04 - addresses page interactions', 'Edit address']);
        e.preventDefault();
        this.submit();
    });
    $('.delete-address').bind('click', function () {
        _paq.push(['trackEvent', 'Account 04 - addresses page interactions', 'Delete address']);

    });



    //Account 11 - reset password
    $('#password-reset').bind('submit', function (e) {
        _paq.push(['trackEvent', 'Account 11 - reset password', 'user successfully reset password']);
    });


    //Event category: Account 12 - navigation
    $('#Applications-Link').bind('click', function () {
        _paq.push(['trackEvent', 'Account 12 - navigation', 'click Applications link in navigation']);
    });
    $('#Account-Link').bind('click', function () {
        _paq.push(['trackEvent', 'Account 12 - navigation', 'click Account link in navigation']);
    });
    $('#Addresses-Link').bind('click', function () {
        _paq.push(['trackEvent', 'Account 12 - navigation', 'click Addresses link in navigation']);
    });
    $('#sign-out-link').bind('click', function () {
        _paq.push(['trackEvent', 'Account 12 - navigation', 'click Sign out link in navigation']);
    });




});