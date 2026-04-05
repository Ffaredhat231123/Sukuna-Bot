const ms = require('ms');

function evaluateAccountAge(createdAt) {
    const now = new Date();
    const ageInMs = now - createdAt;
    
    const oneYearInMs = ms('365d');
    const fiveMonthsInMs = ms('150d'); // Aproximación de 5 meses (30 días c/u)
    const thresholdHigh = oneYearInMs + fiveMonthsInMs;

    if (ageInMs >= thresholdHigh) {
        return 'VERIFIED';
    } else if (ageInMs < oneYearInMs) {
        return 'PENDING';
    } else {
        return 'MANUAL_REVIEW';
    }
}

module.exports = { evaluateAccountAge };
