let expect;
let oneTimePasscodeService;

before("Setup", async function () {
    const chai = await import("chai");
    expect = chai.expect;
    oneTimePasscodeService = require('../../app/services/oneTimePasscodeService');
});

describe('OneTimePasscodeService', function() {

    describe('generateOneTimePasscode', function() {

        it('should generate a 6 digit passcode', async function() {
            const passcode = await oneTimePasscodeService.generateOneTimePasscode();

            expect(passcode).to.be.a('number');
            expect(passcode.toString().length).to.equal(6);
        });

        it('should generate a passcode between 100000 and 999999', async function() {
            const passcode = await oneTimePasscodeService.generateOneTimePasscode();

            expect(passcode).to.be.at.least(100000);
            expect(passcode).to.be.at.most(999999);
        });

        it('should generate different passcodes on multiple calls', async function() {
            const passcodes = new Set();

            // Generate 10 passcodes
            for (let i = 0; i < 10; i++) {
                const passcode = await oneTimePasscodeService.generateOneTimePasscode();
                passcodes.add(passcode);
            }

            // With random generation, we should get at least some unique values
            // (statistically very likely to get at least 2 unique out of 10)
            expect(passcodes.size).to.be.at.least(2);
        });

        it('should only generate numeric passcodes', async function() {
            const passcode = await oneTimePasscodeService.generateOneTimePasscode();

            expect(Number.isInteger(passcode)).to.be.true;
            expect(passcode).to.not.be.NaN;
        });

    });

});

