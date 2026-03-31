let expect;

before("Setup", async function () {
    const chai = await import("chai");
    expect = chai.expect;
});

describe('Phone Number Validation', function() {

    // Testing the phone patterns used in controllers
    const mobilePattern = /^(\+|\d|\(|\#| )(\+|\d|\(| |\-)([0-9]|\(|\)| |\-){5,14}$/;
    const phonePattern = /^(\+|\d|\(|\#| )(\+|\d|\(| |\-)([0-9]|\(|\)| |\-){5,14}$/;

    describe('Valid Phone Numbers', function() {

        it('should accept UK mobile number', function() {
            expect(mobilePattern.test('07123456789')).to.be.true;
        });

        it('should accept international format with plus', function() {
            expect(mobilePattern.test('+447123456789')).to.be.true;
        });

        it('should accept number with spaces', function() {
            expect(mobilePattern.test('07123 456 789')).to.be.true;
        });

        it('should accept number with hyphens', function() {
            expect(phonePattern.test('0712-345-6789')).to.be.true;
        });

        it('should accept number with parentheses', function() {
            expect(phonePattern.test('(0712) 345 6789')).to.be.true;
        });

        it('should accept minimum length number (7 chars)', function() {
            expect(mobilePattern.test('1234567')).to.be.true;
        });

        it('should accept maximum length number (16 chars)', function() {
            expect(mobilePattern.test('1234567890123456')).to.be.true;
        });

    });

    describe('Invalid Phone Numbers', function() {

        it('should reject empty string', function() {
            expect(mobilePattern.test('')).to.be.false;
        });

        it('should reject number too short (less than 7)', function() {
            expect(mobilePattern.test('12345')).to.be.false;
        });

        it('should reject number with letters', function() {
            expect(mobilePattern.test('0712abc6789')).to.be.false;
        });

        it('should reject number starting with invalid character', function() {
            expect(mobilePattern.test('@7123456789')).to.be.false;
        });

    });

    describe('Edge Cases', function() {

        it('should accept number starting with hash', function() {
            expect(mobilePattern.test('#123456789')).to.be.true;
        });

        it('should accept number with multiple spaces', function() {
            expect(mobilePattern.test('07 123 456 789')).to.be.true;
        });

    });

    describe('Length Validation (used in models)', function() {

        const isValidPhoneLength = (phone) => {
            return phone.length >= 6 && phone.length <= 25;
        };

        it('should accept phone number within length bounds', function() {
            expect(isValidPhoneLength('07123456789')).to.be.true;
        });

        it('should reject phone number too short', function() {
            expect(isValidPhoneLength('12345')).to.be.false;
        });

        it('should reject phone number too long', function() {
            expect(isValidPhoneLength('12345678901234567890123456')).to.be.false;
        });

        it('should accept phone at minimum length (6)', function() {
            expect(isValidPhoneLength('123456')).to.be.true;
        });

        it('should accept phone at maximum length (25)', function() {
            expect(isValidPhoneLength('1234567890123456789012345')).to.be.true;
        });

    });

});

