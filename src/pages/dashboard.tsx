import { useMemo } from "react";
import { Link } from "wouter";
import { TrendingUp, TrendingDown, PiggyBank, Wallet, Flame, Star, Plus, ArrowRight } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { useCurrency } from "@/hooks/use-currency";
import { getMonthlyStats, calculateStreak, getFinancialLevel } from "@/lib/gamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { format, startOfMonth, endOfMonth, parseISO, subMonths } from "date-fns";

const EXPENSE_COLORS = [
  "hsl(174,88%,42%)",
  "hsl(205,82%,58%)",
  "hsl(254,70%,65%)",
  "hsl(280,65%,62%)",
  "hsl(338,72%,60%)",
  "hsl(20,85%,58%)",
  "hsl(42,90%,52%)",
  "hsl(152,65%,48%)",
  "hsl(230,75%,65%)",
  "hsl(4,72%,58%)",
];

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  const { symbol, fmt } = useCurrency();
  return (
    <Card data-testid={`card-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{symbol}{fmt(value)}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-muted`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { transactions, isLoading } = useTransactions();
  const { symbol, fmt } = useCurrency();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const currentMonthLabel = format(now, "MMMM yyyy");

  const monthTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        const d = parseISO(t.date);
        return d >= monthStart && d <= monthEnd;
      }),
    [transactions]
  );

  const income = useMemo(
    () => monthTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [monthTransactions]
  );
  const expenses = useMemo(
    () => monthTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [monthTransactions]
  );
  const investments = useMemo(
    () => monthTransactions.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0),
    [monthTransactions]
  );
  const balance = income - expenses - investments;

  const monthlyStats = useMemo(() => getMonthlyStats(transactions), [transactions]);
  const streak = useMemo(() => calculateStreak(monthlyStats), [monthlyStats]);
  const level = useMemo(() => getFinancialLevel(monthlyStats), [monthlyStats]);

  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  const last6MonthsData = useMemo(() => {
    return Array.from({ length: 6 })
      .map((_, i) => {
        const d = subMonths(now, 5 - i);
        const key = format(d, "yyyy-MM");
        const stat = monthlyStats[key] || { income: 0, expense: 0, investment: 0 };
        return {
          name: format(d, "MMM"),
          Income: stat.income,
          Expenses: stat.expense,
          Investments: stat.investment,
        };
      });
  }, [monthlyStats]);

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [transactions]
  );

  const levelProgress = level.nextThreshold
    ? Math.min((level.currentAvg / level.nextThreshold) * 100, 100)
    : 100;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Your vault is empty</h2>
        <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
          Start tracking your finances by adding your first transaction. Everything stays private — stored only on this device.
        </p>
        <Link href="/add">
          <Button size="lg" className="gap-2" data-testid="button-add-first-transaction">
            <Plus className="w-4 h-4" />
            Add First Transaction
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm">{currentMonthLabel}</p>
        </div>
        <Link href="/add">
          <Button size="sm" className="gap-2" data-testid="button-add-transaction">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Income" value={income} icon={TrendingUp} color="text-emerald-500" />
        <SummaryCard label="Expenses" value={expenses} icon={TrendingDown} color="text-red-400" />
        <SummaryCard label="Invested" value={investments} icon={PiggyBank} color="text-primary" />
        <SummaryCard
          label="Balance"
          value={balance}
          icon={Wallet}
          color={balance >= 0 ? "text-emerald-500" : "text-red-400"}
          sub={income > 0 ? `${Math.round(((income - expenses) / income) * 100)}% savings rate` : undefined}
        />
      </div>

      {/* Gamification Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card data-testid="card-streak">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Savings Streak</p>
                <p className="text-xl font-bold">{streak} {streak === 1 ? "month" : "months"}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {streak === 0
                ? "Spend less than you earn to start your streak"
                : `You've been spending less than you earn for ${streak} consecutive ${streak === 1 ? "month" : "months"}`}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-level">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Financial Level</p>
                <p className="text-xl font-bold">
                  Level {level.level} <span className="text-primary font-medium text-base">· {level.title}</span>
                </p>
              </div>
            </div>
            <Progress value={levelProgress} className="h-1.5 mb-2" />
            <p className="text-xs text-muted-foreground">
              {level.nextThreshold
                ? `${fmt(level.currentAvg)}% avg savings rate · Next level at ${level.nextThreshold}%`
                : `${fmt(level.currentAvg)}% avg savings rate · Max level reached`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {spendingByCategory.length > 0 && (
          <Card data-testid="card-spending-chart">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {spendingByCategory.map((_, i) => (
                      <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`${symbol}${fmt(v)}`, ""]}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--popover-foreground))",
                    }}
                    labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {spendingByCategory.slice(0, 6).map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }}
                    />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-monthly-chart">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={last6MonthsData} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  formatter={(v: number) => [`${symbol}${fmt(v)}`, ""]}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                />
                <Bar dataKey="Income" fill="hsl(152,65%,48%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="hsl(4,72%,58%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Investments" fill="hsl(174,88%,42%)" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "hsl(var(--foreground))" }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <Card data-testid="card-recent-transactions">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Transactions</CardTitle>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-muted-foreground hover:text-foreground">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-1"
                data-testid={`row-transaction-${tx.id}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      tx.type === "income"
                        ? "bg-emerald-500"
                        : tx.type === "expense"
                        ? "bg-red-400"
                        : "bg-primary"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {tx.name || tx.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.category} · {format(parseISO(tx.date), "MMM d")}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    tx.type === "income"
                      ? "text-emerald-500"
                      : tx.type === "expense"
                      ? "text-red-400"
                      : "text-primary"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}{symbol}{fmt(tx.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
