let expect;
let isEmail;

before("Setup", async function () {
    const chai = await import("chai");
    expect = chai.expect;
    isEmail = require('isemail');
});

describe('Email Validation', function() {

    // Testing the email validation logic used throughout the application

    describe('Valid Email Formats', function() {

        it('should accept standard email format', function() {
            expect(isEmail.validate('user@example.com')).to.be.true;
        });

        it('should accept email with subdomain', function() {
            expect(isEmail.validate('user@mail.example.com')).to.be.true;
        });

        it('should accept email with plus sign', function() {
            expect(isEmail.validate('user+tag@example.com')).to.be.true;
        });

        it('should accept email with dots in local part', function() {
            expect(isEmail.validate('first.last@example.com')).to.be.true;
        });

        it('should accept email with numbers', function() {
            expect(isEmail.validate('user123@example.com')).to.be.true;
        });

        it('should accept email with hyphens in domain', function() {
            expect(isEmail.validate('user@my-domain.com')).to.be.true;
        });

        it('should accept email with country TLD', function() {
            expect(isEmail.validate('user@example.co.uk')).to.be.true;
        });

        it('should accept email with new TLDs', function() {
            expect(isEmail.validate('user@example.technology')).to.be.true;
        });

    });

    describe('Invalid Email Formats', function() {

        it('should reject email without @ symbol', function() {
            expect(isEmail.validate('userexample.com')).to.be.false;
        });

        it('should reject email without domain', function() {
            expect(isEmail.validate('user@')).to.be.false;
        });

        it('should reject email without local part', function() {
            expect(isEmail.validate('@example.com')).to.be.false;
        });

        it('should reject email with spaces', function() {
            expect(isEmail.validate('user @example.com')).to.be.false;
        });

        it('should reject email with multiple @ symbols', function() {
            expect(isEmail.validate('user@@example.com')).to.be.false;
        });

        it('should reject empty string', function() {
            expect(isEmail.validate('')).to.be.false;
        });

        it('should reject plain text', function() {
            expect(isEmail.validate('notanemail')).to.be.false;
        });

        it('should reject email ending with dot', function() {
            expect(isEmail.validate('user@example.')).to.be.false;
        });

        it('should reject email with consecutive dots', function() {
            expect(isEmail.validate('user@example..com')).to.be.false;
        });

    });

    describe('Edge Cases', function() {

        it('should handle very long email addresses', function() {
            const longLocal = 'a'.repeat(64);
            const longEmail = `${longLocal}@example.com`;
            // The validation result depends on the library, but it should not throw
            expect(typeof isEmail.validate(longEmail)).to.equal('boolean');
        });

        it('should handle email with special characters in local part', function() {
            expect(isEmail.validate("user!#$%&'*+-/=?^_`{|}~@example.com")).to.be.true;
        });

        it('should handle uppercase email', function() {
            expect(isEmail.validate('USER@EXAMPLE.COM')).to.be.true;
        });

        it('should handle mixed case email', function() {
            expect(isEmail.validate('User@Example.Com')).to.be.true;
        });

    });

});

