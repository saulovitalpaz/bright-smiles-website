const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';

const invalidPeriod = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const parseFinancePeriod = ({ month, year } = {}) => {
    const hasMonth = month !== undefined && month !== '';
    const hasYear = year !== undefined && year !== '';
    if (!hasMonth && !hasYear) return { overview: true };
    if (!hasMonth || !hasYear) throw invalidPeriod('month and year must be provided together');

    const numericMonth = Number(month);
    const numericYear = Number(year);
    if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
        throw invalidPeriod('month must be between 1 and 12');
    }
    if (!Number.isInteger(numericYear) || numericYear < 2000 || numericYear > 2100) {
        throw invalidPeriod('year must be between 2000 and 2100');
    }

    const nextMonth = numericMonth === 12 ? 1 : numericMonth + 1;
    const nextYear = numericMonth === 12 ? numericYear + 1 : numericYear;
    // São Paulo has no daylight-saving transitions after 2019. Keeping the named
    // zone here makes the business boundary explicit instead of using server-local time.
    const toSaoPauloMidnight = (valueYear, valueMonth) => new Date(
        `${valueYear}-${String(valueMonth).padStart(2, '0')}-01T00:00:00-03:00`
    );
    return {
        overview: false,
        timeZone: SAO_PAULO_TIME_ZONE,
        start: toSaoPauloMidnight(numericYear, numericMonth),
        endExclusive: toSaoPauloMidnight(nextYear, nextMonth)
    };
};

const financePeriodWhere = (period = {}) => period.overview !== false ? {} : {
    date: { gte: period.start, lt: period.endExclusive }
};

const parseFinanceTransactionDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw invalidPeriod('date must use YYYY-MM-DD');
    }
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(`${value}T00:00:00-03:00`);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw invalidPeriod('date is invalid');
    }
    return date;
};

const financeCumulativeWhere = (period = {}) => period.overview !== false
    ? {}
    : { date: { lt: period.start } };

const financeStatsWhere = (period) => {
    const periodWhere = financePeriodWhere(period);
    return {
        realizedIncome: { ...periodWhere, type: 'income', paymentStatus: { notIn: ['pending', 'voided'] } },
        pendingIncome: { ...periodWhere, type: 'income', paymentStatus: 'pending' },
        expense: { ...periodWhere, type: 'expense', paymentStatus: { not: 'voided' } }
    };
};

module.exports = {
    parseFinancePeriod,
    parseFinanceTransactionDate,
    financePeriodWhere,
    financeCumulativeWhere,
    financeStatsWhere,
    SAO_PAULO_TIME_ZONE
};
