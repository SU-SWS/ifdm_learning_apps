type CompoundingFrequency = "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "semi-annually" | "annually";

interface CalculationResults {
  contributionPerPeriod: number;
  totalDeposited: number;
  interestEarned: number;
  finalBalance: number;
  timeInMonths: number;
}

interface YearlyBreakdown {
  year: number;
  startingBalance: number;
  contributions: number;
  interestEarned: number;
  endingBalance: number;
}

/**
 * Get compounding periods per year and rate per period
 */
export function getCompoundingParams(frequency: CompoundingFrequency, annualRate: number) {
  let periodsPerYear = 12;
  if (frequency === "daily") periodsPerYear = 365;
  else if (frequency === "weekly") periodsPerYear = 52;
  else if (frequency === "bi-weekly") periodsPerYear = 26;
  else if (frequency === "quarterly") periodsPerYear = 4;
  else if (frequency === "annually") periodsPerYear = 1;
  else if (frequency === "semi-annually") periodsPerYear = 2;

  const ratePerPeriod = annualRate / 100 / periodsPerYear;
  return { periodsPerYear, ratePerPeriod };
}

/**
 * Get readable period name from compounding frequency
 */
export function getPeriodLabel(frequency: CompoundingFrequency): string {
  switch (frequency) {
    case "daily":
      return "day";
    case "weekly":
      return "week";
    case "bi-weekly":
      return "two weeks";
    case "monthly":
      return "month";
    case "quarterly":
      return "quarter";
    case "semi-annually":
      return "six months";
    case "annually":
      return "year";
    default:
      return "period";
  }
}

/**
 * Calculate year-by-year breakdown of savings growth
 */
export function calculateYearlyBreakdown(
  contribution: number,
  totalPeriods: number,
  currentBalance: number,
  compounding: CompoundingFrequency,
  interestRate: number
): YearlyBreakdown[] {
  const { periodsPerYear, ratePerPeriod } = getCompoundingParams(compounding, interestRate);
  const breakdown: YearlyBreakdown[] = [];
  let balance = currentBalance;
  const totalYears = Math.ceil(totalPeriods / periodsPerYear);

  for (let year = 1; year <= totalYears; year++) {
    const startingBalance = balance;
    const periodsInThisYear = Math.min(periodsPerYear, totalPeriods - (year - 1) * periodsPerYear);
    let yearlyContributions = 0;
    let yearlyInterest = 0;

    const futureValueOfInitial = startingBalance * Math.pow(1 + ratePerPeriod, periodsInThisYear);
    const futureValueOfAnnuity =
      contribution * ((Math.pow(1 + ratePerPeriod, periodsInThisYear) - 1) / ratePerPeriod);
    balance = futureValueOfInitial + futureValueOfAnnuity;
    yearlyContributions = contribution * periodsInThisYear;
    yearlyInterest = balance - (startingBalance + yearlyContributions);

    breakdown.push({
      year,
      startingBalance,
      contributions: yearlyContributions,
      interestEarned: yearlyInterest,
      endingBalance: balance,
    });
  }

  return breakdown;
}

/**
 * Calculate monthly savings needed to reach goal (Savings tab)
 */
export function calculateMonthySavings(
  savingsGoal: number,
  currentBalance: number,
  timeYears: number,
  timeMonths: number,
  interestRate: number,
  compounding: CompoundingFrequency
): { results: CalculationResults; breakdown: YearlyBreakdown[] } {
  const { periodsPerYear, ratePerPeriod } = getCompoundingParams(compounding, interestRate);
  const totalTimeInMonths = timeYears * 12 + timeMonths;
  const totalPeriods = timeYears * periodsPerYear + timeMonths * (periodsPerYear / 12);

  const futureValueOfInitial = currentBalance * Math.pow(1 + ratePerPeriod, totalPeriods);
  const remainingAmount = savingsGoal - futureValueOfInitial;

  let results: CalculationResults;

  if (remainingAmount <= 0) {
    results = {
      contributionPerPeriod: 0,
      totalDeposited: currentBalance,
      interestEarned: savingsGoal - currentBalance,
      finalBalance: savingsGoal,
      timeInMonths: totalTimeInMonths,
    };
  } else if (totalPeriods < 1) {
    const requiredContributionPerPeriod = savingsGoal - currentBalance;
    const totalDeposited = currentBalance + requiredContributionPerPeriod;
    results = {
      contributionPerPeriod: requiredContributionPerPeriod,
      totalDeposited: totalDeposited,
      interestEarned: 0,
      finalBalance: savingsGoal,
      timeInMonths: totalTimeInMonths,
    };
  } else {
    const requiredContributionPerPeriod =
      remainingAmount / ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod);
    const totalDeposited = currentBalance + requiredContributionPerPeriod * totalPeriods;
    results = {
      contributionPerPeriod: requiredContributionPerPeriod,
      totalDeposited: totalDeposited,
      interestEarned: savingsGoal - totalDeposited,
      finalBalance: savingsGoal,
      timeInMonths: totalTimeInMonths,
    };
  }

  const breakdown = calculateYearlyBreakdown(
    results.contributionPerPeriod,
    totalPeriods,
    currentBalance,
    compounding,
    interestRate
  );

  return { results, breakdown };
}

/**
 * Calculate future balance (Future Balance tab)
 */
export function calculateFutureBalance(
  currentBalance: number,
  contributionPerPeriod: number,
  timeYears: number,
  timeMonths: number,
  interestRate: number,
  compounding: CompoundingFrequency
): { results: CalculationResults; breakdown: YearlyBreakdown[] } {
  const { periodsPerYear, ratePerPeriod } = getCompoundingParams(compounding, interestRate);
  const totalTimeInMonths = timeYears * 12 + timeMonths;
  const totalPeriods = timeYears * periodsPerYear + timeMonths * (periodsPerYear / 12);

  const futureValueOfInitial = currentBalance * Math.pow(1 + ratePerPeriod, totalPeriods);
  const futureValueOfAnnuity =
    contributionPerPeriod * ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod);
  const finalBalance = futureValueOfInitial + futureValueOfAnnuity;
  const totalDeposited = currentBalance + contributionPerPeriod * totalPeriods;

  const results: CalculationResults = {
    contributionPerPeriod: contributionPerPeriod,
    totalDeposited: totalDeposited,
    interestEarned: finalBalance - totalDeposited,
    finalBalance: finalBalance,
    timeInMonths: totalTimeInMonths,
  };

  const breakdown = calculateYearlyBreakdown(
    contributionPerPeriod,
    totalPeriods,
    currentBalance,
    compounding,
    interestRate
  );

  return { results, breakdown };
}

/**
 * Calculate time to reach goal (Time to Goal tab)
 */
export function calculateTimeToGoal(
  savingsGoal: number,
  currentBalance: number,
  contributionPerPeriod: number,
  interestRate: number,
  compounding: CompoundingFrequency
): { results: CalculationResults; breakdown: YearlyBreakdown[] } {
  const { periodsPerYear, ratePerPeriod } = getCompoundingParams(compounding, interestRate);

  let results: CalculationResults;

  if (contributionPerPeriod === 0) {
    // Interest-only growth (no contributions)
    if (currentBalance <= 0 || savingsGoal <= currentBalance) {
      results = {
        contributionPerPeriod: 0,
        totalDeposited: currentBalance,
        interestEarned: savingsGoal - currentBalance,
        finalBalance: savingsGoal,
        timeInMonths: 0,
      };
    } else {
      // Use compound interest formula: n = log(FV/PV) / log(1 + r)
      const ratio = savingsGoal / currentBalance;
      const periodsToGoal = Math.log(ratio) / Math.log(1 + ratePerPeriod);
      const months = Math.round(periodsToGoal * (12 / periodsPerYear));
      const interestEarned = savingsGoal - currentBalance;

      results = {
        contributionPerPeriod: 0,
        totalDeposited: currentBalance,
        interestEarned: interestEarned,
        finalBalance: savingsGoal,
        timeInMonths: months,
      };
    }
  } else if (contributionPerPeriod > 0) {
    // With contributions
    const numerator = savingsGoal + contributionPerPeriod / ratePerPeriod;
    const denominator = currentBalance + contributionPerPeriod / ratePerPeriod;
    const periodsToGoal = Math.log(numerator / denominator) / Math.log(1 + ratePerPeriod);
    const months = Math.round(periodsToGoal * (12 / periodsPerYear));

    const futureValueOfInitial = currentBalance * Math.pow(1 + ratePerPeriod, periodsToGoal);
    const futureValueOfAnnuity =
      contributionPerPeriod *
      ((Math.pow(1 + ratePerPeriod, periodsToGoal) - 1) / ratePerPeriod);
    const finalBalance = futureValueOfInitial + futureValueOfAnnuity;
    const totalDeposited = currentBalance + contributionPerPeriod * periodsToGoal;

    results = {
      contributionPerPeriod: contributionPerPeriod,
      totalDeposited: totalDeposited,
      interestEarned: finalBalance - totalDeposited,
      finalBalance: finalBalance,
      timeInMonths: months,
    };
  } else {
    // contributionPerPeriod < 0 (blocked by validation)
    results = {
      contributionPerPeriod: contributionPerPeriod,
      totalDeposited: currentBalance,
      interestEarned: 0,
      finalBalance: currentBalance,
      timeInMonths: 0,
    };
  }

  const breakdown = calculateYearlyBreakdown(
    results.contributionPerPeriod,
    results.timeInMonths / (12 / periodsPerYear),
    currentBalance,
    compounding,
    interestRate
  );

  return { results, breakdown };
}
