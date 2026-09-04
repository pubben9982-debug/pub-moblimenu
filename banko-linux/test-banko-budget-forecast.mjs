import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  analyzeBudget,
  canAcceptSale,
  createPeriod,
} = require("./banko-budget-forecast.js");

function weeklySales({ start, weeks, eventsPerWeek, boardsPerEvent, boardPriceOre }) {
  const base = new Date(start);
  const sales = [];
  const spacingDays = 7 / eventsPerWeek;
  for (let week = 0; week < weeks; week += 1) {
    for (let event = 0; event < eventsPerWeek; event += 1) {
      const occurredAt = new Date(base.getTime() + (week * 7 + event * spacingDays) * 86400000);
      sales.push({ occurredAt, boards: boardsPerEvent, boardPriceOre });
    }
  }
  return sales;
}

{
  const period = createPeriod("2026-09-01T12:00:00Z");
  assert.equal(period.start.toISOString(), "2026-09-01T12:00:00.000Z");
  assert.equal(period.end.toISOString(), "2027-09-01T12:00:00.000Z");
}

{
  // Example: 50 guests x 5 boards x 2 evenings/week at 1 kr per board.
  const sales = weeklySales({
    start: "2026-09-01T12:00:00Z",
    weeks: 8,
    eventsPerWeek: 2,
    boardsPerEvent: 250,
    boardPriceOre: 100,
  });
  const analysis = analyzeBudget({
    periodStart: "2026-09-01T12:00:00Z",
    sales,
    now: "2026-10-27T12:00:00Z",
  });
  assert.equal(analysis.status, "red");
  assert.ok(analysis.forecastPeriodSalesOre > 1_500_000);
  assert.ok(analysis.recommendedBoardPriceOre >= 45 && analysis.recommendedBoardPriceOre <= 55);
  assert.ok(analysis.projectedLimitAt);
}

{
  // Same activity at 0.25 kr per board should be comfortably below the cap.
  const sales = weeklySales({
    start: "2026-09-01T12:00:00Z",
    weeks: 8,
    eventsPerWeek: 2,
    boardsPerEvent: 250,
    boardPriceOre: 25,
  });
  const analysis = analyzeBudget({
    periodStart: "2026-09-01T12:00:00Z",
    sales,
    now: "2026-10-27T12:00:00Z",
  });
  assert.equal(analysis.status, "green");
  assert.ok(analysis.forecastPeriodSalesOre < 1_500_000);
}

{
  // Exactly 15,000 kr is not allowed when the policy requires sales to stay under the limit.
  const analysis = analyzeBudget({
    periodStart: "2026-09-01T12:00:00Z",
    sales: [{
      occurredAt: "2026-09-02T12:00:00Z",
      boards: 14999,
      boardPriceOre: 100,
    }],
    now: "2026-09-03T12:00:00Z",
  });
  assert.equal(analysis.usedSalesOre, 1_499_900);
  assert.equal(analysis.maxAdditionalSaleOre, 99);
  assert.deepEqual(
    canAcceptSale({ analysis, boards: 1, boardPriceOre: 100 }),
    {
      allowed: false,
      saleOre: 100,
      projectedUsedSalesOre: 1_500_000,
      reason: "annual-sales-limit",
    },
  );
}

{
  // Sales outside the selected 12-month period do not count in that period.
  const analysis = analyzeBudget({
    periodStart: "2026-09-01T00:00:00Z",
    sales: [
      { occurredAt: "2026-08-31T23:59:59Z", boards: 100, boardPriceOre: 100 },
      { occurredAt: "2026-09-01T00:00:00Z", boards: 10, boardPriceOre: 100 },
      { occurredAt: "2027-09-01T00:00:00Z", boards: 100, boardPriceOre: 100 },
    ],
    now: "2026-09-02T00:00:00Z",
  });
  assert.equal(analysis.usedSalesOre, 1000);
  assert.equal(analysis.usedBoards, 10);
}

console.log("Banko budget forecast tests passed");
