"use strict";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT_ORE = 1_500_000; // 15,000.00 kr. Policy condition is strictly below this amount.
const DEFAULT_LOOKBACK_DAYS = 56;

function toDate(value, label) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error(`${label} must be a valid date`);
  }
  return date;
}

function asNonNegativeInt(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }
  return Math.round(number);
}

function normalizeSale(raw) {
  const occurredAt = toDate(raw.occurredAt, "sale.occurredAt");
  const boards = asNonNegativeInt(raw.boards, "sale.boards");
  const boardPriceOre = asNonNegativeInt(raw.boardPriceOre, "sale.boardPriceOre");
  const saleOre = raw.saleOre == null
    ? boards * boardPriceOre
    : asNonNegativeInt(raw.saleOre, "sale.saleOre");

  if (saleOre !== boards * boardPriceOre) {
    throw new Error("sale.saleOre must equal boards * boardPriceOre");
  }

  return {
    occurredAt,
    boards,
    boardPriceOre,
    saleOre,
  };
}

function addMonthsUtc(date, months) {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    0,
    result.getUTCHours(),
    result.getUTCMinutes(),
    result.getUTCSeconds(),
    result.getUTCMilliseconds(),
  )).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

function createPeriod(periodStart) {
  const start = toDate(periodStart, "periodStart");
  const end = addMonthsUtc(start, 12);
  return { start, end };
}

function daysBetween(start, end) {
  return Math.max(0, (end.getTime() - start.getTime()) / DAY_MS);
}

function analyzeBudget({
  periodStart,
  sales = [],
  now = new Date(),
  salesLimitOre = DEFAULT_LIMIT_ORE,
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
  yellowForecastRatio = 0.9,
}) {
  const period = createPeriod(periodStart);
  const nowDate = toDate(now, "now");
  const limitOre = asNonNegativeInt(salesLimitOre, "salesLimitOre");
  if (limitOre <= 0) throw new Error("salesLimitOre must be greater than zero");
  if (!(yellowForecastRatio > 0 && yellowForecastRatio < 1)) {
    throw new Error("yellowForecastRatio must be between 0 and 1");
  }
  if (!(Number(lookbackDays) > 0)) {
    throw new Error("lookbackDays must be greater than zero");
  }

  const normalized = sales.map(normalizeSale);
  const periodSales = normalized.filter((sale) => (
    sale.occurredAt >= period.start && sale.occurredAt < period.end
  ));

  const usedSalesOre = periodSales.reduce((sum, sale) => sum + sale.saleOre, 0);
  const usedBoards = periodSales.reduce((sum, sale) => sum + sale.boards, 0);
  const legalHeadroomOre = Math.max(0, limitOre - usedSalesOre);
  // Because the rule is "under" the limit, a transaction that lands exactly on the limit must be refused.
  const maxAdditionalSaleOre = Math.max(0, legalHeadroomOre - 1);

  const effectiveNow = nowDate < period.start
    ? period.start
    : nowDate > period.end
      ? period.end
      : nowDate;
  const elapsedDays = Math.max(1, daysBetween(period.start, effectiveNow));
  const remainingDays = daysBetween(effectiveNow, period.end);

  const lookbackStart = new Date(effectiveNow.getTime() - Number(lookbackDays) * DAY_MS);
  const recentSales = periodSales.filter((sale) => (
    sale.occurredAt >= lookbackStart && sale.occurredAt <= effectiveNow
  ));
  const recentSaleOre = recentSales.reduce((sum, sale) => sum + sale.saleOre, 0);
  const recentBoards = recentSales.reduce((sum, sale) => sum + sale.boards, 0);
  const actualLookbackDays = Math.max(1, Math.min(Number(lookbackDays), elapsedDays));

  const overallDailySaleOre = usedSalesOre / elapsedDays;
  const recentDailySaleOre = recentSaleOre / actualLookbackDays;
  const forecastDailySaleOre = Math.max(overallDailySaleOre, recentDailySaleOre);
  const forecastPeriodSalesOre = usedSalesOre + forecastDailySaleOre * remainingDays;
  const safeDailySaleOre = remainingDays > 0 ? maxAdditionalSaleOre / remainingDays : 0;
  const recentBoardsPerDay = recentBoards / actualLookbackDays;
  const recommendedBoardPriceOre = recentBoardsPerDay > 0
    ? Math.max(0, Math.floor(safeDailySaleOre / recentBoardsPerDay))
    : null;

  let projectedLimitAt = null;
  if (forecastDailySaleOre > 0 && maxAdditionalSaleOre >= 0) {
    const daysUntilLimit = maxAdditionalSaleOre / forecastDailySaleOre;
    const candidate = new Date(effectiveNow.getTime() + daysUntilLimit * DAY_MS);
    if (candidate < period.end) projectedLimitAt = candidate;
  }

  const periodClosed = nowDate >= period.end;
  const overLimit = usedSalesOre >= limitOre;
  const projectedRatio = forecastPeriodSalesOre / limitOre;
  let status = "green";
  if (periodClosed) status = overLimit ? "blocked" : "closed";
  else if (overLimit || maxAdditionalSaleOre <= 0) status = "blocked";
  else if (projectedRatio >= 1) status = "red";
  else if (projectedRatio >= yellowForecastRatio) status = "yellow";

  return {
    periodStart: period.start.toISOString(),
    periodEnd: period.end.toISOString(),
    status,
    salesLimitOre: limitOre,
    usedSalesOre,
    usedBoards,
    legalHeadroomOre,
    maxAdditionalSaleOre,
    usedRatio: usedSalesOre / limitOre,
    elapsedDays,
    remainingDays,
    recentSaleOre,
    recentBoards,
    overallDailySaleOre,
    recentDailySaleOre,
    forecastDailySaleOre,
    forecastPeriodSalesOre,
    projectedRatio,
    projectedLimitAt: projectedLimitAt ? projectedLimitAt.toISOString() : null,
    safeDailySaleOre,
    recentBoardsPerDay,
    recommendedBoardPriceOre,
  };
}

function canAcceptSale({ analysis, boards, boardPriceOre }) {
  if (!analysis || typeof analysis !== "object") {
    throw new Error("analysis is required");
  }
  const boardCount = asNonNegativeInt(boards, "boards");
  const priceOre = asNonNegativeInt(boardPriceOre, "boardPriceOre");
  const saleOre = boardCount * priceOre;
  const allowed = saleOre <= analysis.maxAdditionalSaleOre;
  return {
    allowed,
    saleOre,
    projectedUsedSalesOre: analysis.usedSalesOre + saleOre,
    reason: allowed ? null : "annual-sales-limit",
  };
}

module.exports = {
  DEFAULT_LIMIT_ORE,
  DEFAULT_LOOKBACK_DAYS,
  analyzeBudget,
  canAcceptSale,
  createPeriod,
  normalizeSale,
};
