import { Transaction } from "./db";
import { parseISO, format, differenceInDays, startOfMonth, endOfMonth, isBefore, isAfter, subMonths, getYear, getMonth } from "date-fns";

export interface MonthlyStats {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  investment: number;
  savingsRate: number;
}

export function getMonthlyStats(transactions: Transaction[]): Record<string, MonthlyStats> {
  const stats: Record<string, MonthlyStats> = {};

  transactions.forEach((tx) => {
    const month = tx.date.substring(0, 7); // YYYY-MM
    if (!stats[month]) {
      stats[month] = { month, income: 0, expense: 0, investment: 0, savingsRate: 0 };
    }

    if (tx.type === "income") {
      stats[month].income += tx.amount;
    } else if (tx.type === "expense") {
      stats[month].expense += tx.amount;
    } else if (tx.type === "investment") {
      stats[month].investment += tx.amount;
    }
  });

  // Calculate savings rate for each month
  Object.values(stats).forEach((stat) => {
    if (stat.income > 0) {
      const saved = stat.income - stat.expense;
      stat.savingsRate = saved > 0 ? (saved / stat.income) * 100 : 0;
    }
  });

  return stats;
}

export function calculateStreak(monthlyStats: Record<string, MonthlyStats>): number {
  let streak = 0;
  const sortedMonths = Object.keys(monthlyStats).sort((a, b) => b.localeCompare(a)); // Newest first

  if (sortedMonths.length === 0) return 0;

  for (const month of sortedMonths) {
    const stat = monthlyStats[month];
    if (stat.income > stat.expense) {
      streak++;
    } else {
      break; // Streak broken
    }
  }

  return streak;
}

export function getFinancialLevel(monthlyStats: Record<string, MonthlyStats>): { level: number; title: string; nextThreshold: number | null; currentAvg: number } {
  const months = Object.values(monthlyStats);
  if (months.length === 0) return { level: 1, title: "Beginner", nextThreshold: 10, currentAvg: 0 };

  const totalSavingsRate = months.reduce((sum, stat) => sum + stat.savingsRate, 0);
  const avgSavingsRate = totalSavingsRate / months.length;

  if (avgSavingsRate < 10) return { level: 1, title: "Beginner", nextThreshold: 10, currentAvg: avgSavingsRate };
  if (avgSavingsRate < 20) return { level: 2, title: "Saver", nextThreshold: 20, currentAvg: avgSavingsRate };
  if (avgSavingsRate < 35) return { level: 3, title: "Builder", nextThreshold: 35, currentAvg: avgSavingsRate };
  if (avgSavingsRate < 50) return { level: 4, title: "Optimizer", nextThreshold: 50, currentAvg: avgSavingsRate };
  return { level: 5, title: "Master", nextThreshold: null, currentAvg: avgSavingsRate };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  total: number;
}

export function getAchievements(transactions: Transaction[], monthlyStats: Record<string, MonthlyStats>, currentStreak: number): Achievement[] {
  const achievements: Achievement[] = [];
  const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  
  // 1. First Step - Added first transaction
  const hasFirstStep = sortedTx.length > 0;
  achievements.push({
    id: "first_step",
    title: "First Step",
    description: "Added your first transaction",
    isUnlocked: hasFirstStep,
    unlockedAt: hasFirstStep ? sortedTx[0].date : undefined,
    progress: hasFirstStep ? 1 : 0,
    total: 1,
  });

  // 2. Week Warrior - Logged transactions 7 days in a row
  let maxConsecutiveDays = 0;
  let currentConsecutiveDays = 0;
  let lastDate: Date | null = null;
  let weekWarriorUnlockedAt: string | undefined;

  const uniqueDates = Array.from(new Set(sortedTx.map(t => t.date))).sort();
  
  uniqueDates.forEach((dateStr) => {
    const date = parseISO(dateStr);
    if (!lastDate) {
      currentConsecutiveDays = 1;
    } else {
      const diff = differenceInDays(date, lastDate);
      if (diff === 1) {
        currentConsecutiveDays++;
        if (currentConsecutiveDays === 7 && !weekWarriorUnlockedAt) {
            weekWarriorUnlockedAt = dateStr;
        }
      } else if (diff > 1) {
        currentConsecutiveDays = 1;
      }
    }
    maxConsecutiveDays = Math.max(maxConsecutiveDays, currentConsecutiveDays);
    lastDate = date;
  });

  achievements.push({
    id: "week_warrior",
    title: "Week Warrior",
    description: "Logged transactions 7 days in a row",
    isUnlocked: maxConsecutiveDays >= 7,
    unlockedAt: weekWarriorUnlockedAt,
    progress: Math.min(maxConsecutiveDays, 7),
    total: 7,
  });

  // 3. Saver's Club - Saved 20%+ of income in a month
  const maxSavingsRateMonth = Object.values(monthlyStats).find(m => m.savingsRate >= 20);
  achievements.push({
    id: "savers_club",
    title: "Saver's Club",
    description: "Saved 20%+ of income in a month",
    isUnlocked: !!maxSavingsRateMonth,
    unlockedAt: maxSavingsRateMonth ? `${maxSavingsRateMonth.month}-28` : undefined, // approx end of month
    progress: Math.min(Math.max(...Object.values(monthlyStats).map(m => m.savingsRate), 0), 20),
    total: 20,
  });

  // 4. Streak Starter - 2 month savings streak
  achievements.push({
    id: "streak_starter",
    title: "Streak Starter",
    description: "2 month savings streak",
    isUnlocked: currentStreak >= 2,
    progress: Math.min(currentStreak, 2),
    total: 2,
  });

  // 5. Consistent - 3 month savings streak
  achievements.push({
    id: "consistent",
    title: "Consistent",
    description: "3 month savings streak",
    isUnlocked: currentStreak >= 3,
    progress: Math.min(currentStreak, 3),
    total: 3,
  });

  // 6. Disciplined - 6 month savings streak
  achievements.push({
    id: "disciplined",
    title: "Disciplined",
    description: "6 month savings streak",
    isUnlocked: currentStreak >= 6,
    progress: Math.min(currentStreak, 6),
    total: 6,
  });

  // 7. Investor - Added first investment
  const firstInvestment = sortedTx.find(t => t.type === "investment");
  achievements.push({
    id: "investor",
    title: "Investor",
    description: "Added first investment",
    isUnlocked: !!firstInvestment,
    unlockedAt: firstInvestment?.date,
    progress: firstInvestment ? 1 : 0,
    total: 1,
  });

  // 8. Diversified - Tracked 3 different investment types
  const investmentCategories = new Set(sortedTx.filter(t => t.type === "investment").map(t => t.category));
  achievements.push({
    id: "diversified",
    title: "Diversified",
    description: "Tracked 3 different investment types",
    isUnlocked: investmentCategories.size >= 3,
    progress: Math.min(investmentCategories.size, 3),
    total: 3,
  });

  // 9. Budget Master - Saved 50%+ of income in a month
  const budgetMasterMonth = Object.values(monthlyStats).find(m => m.savingsRate >= 50);
  achievements.push({
    id: "budget_master",
    title: "Budget Master",
    description: "Saved 50%+ of income in a month",
    isUnlocked: !!budgetMasterMonth,
    unlockedAt: budgetMasterMonth ? `${budgetMasterMonth.month}-28` : undefined,
    progress: Math.min(Math.max(...Object.values(monthlyStats).map(m => m.savingsRate), 0), 50),
    total: 50,
  });

  // 10. Tracker - Logged 30 total transactions
  achievements.push({
    id: "tracker",
    title: "Tracker",
    description: "Logged 30 total transactions",
    isUnlocked: transactions.length >= 30,
    unlockedAt: transactions.length >= 30 ? sortedTx[29].date : undefined,
    progress: Math.min(transactions.length, 30),
    total: 30,
  });

  return achievements;
}
