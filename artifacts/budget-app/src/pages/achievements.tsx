import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  Trophy,
  Lock,
  Flame,
  Star,
  TrendingUp,
  CheckCircle,
  Calendar,
  BarChart2,
  Layers,
  Award,
  BookOpen,
  Zap,
} from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { getMonthlyStats, calculateStreak, getFinancialLevel, getAchievements, Achievement } from "@/lib/gamification";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  first_step: CheckCircle,
  week_warrior: Calendar,
  savers_club: TrendingUp,
  streak_starter: Flame,
  consistent: Flame,
  disciplined: Flame,
  investor: BarChart2,
  diversified: Layers,
  budget_master: Award,
  tracker: BookOpen,
};

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = ACHIEVEMENT_ICONS[achievement.id] || Star;
  const pct = (achievement.progress / achievement.total) * 100;

  return (
    <Card
      data-testid={`card-achievement-${achievement.id}`}
      className={`transition-all ${achievement.isUnlocked ? "border-primary/30 bg-card" : "opacity-60"}`}
    >
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`p-2.5 rounded-xl flex-shrink-0 ${
              achievement.isUnlocked ? "bg-primary/15" : "bg-muted"
            }`}
          >
            {achievement.isUnlocked ? (
              <Icon className="w-5 h-5 text-primary" />
            ) : (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={`text-sm font-semibold ${achievement.isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                {achievement.title}
              </p>
              {achievement.isUnlocked && (
                <Trophy className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{achievement.description}</p>
            {achievement.isUnlocked && achievement.unlockedAt && (
              <p className="text-xs text-primary/70 mt-1">
                Unlocked {format(parseISO(achievement.unlockedAt), "MMM d, yyyy")}
              </p>
            )}
          </div>
        </div>

        {!achievement.isUnlocked && (
          <>
            <Progress value={pct} className="h-1.5 mt-1" />
            <p className="text-xs text-muted-foreground mt-1.5">
              {achievement.progress} / {achievement.total}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function Achievements() {
  const { transactions, isLoading } = useTransactions();

  const monthlyStats = useMemo(() => getMonthlyStats(transactions), [transactions]);
  const streak = useMemo(() => calculateStreak(monthlyStats), [monthlyStats]);
  const level = useMemo(() => getFinancialLevel(monthlyStats), [monthlyStats]);
  const achievements = useMemo(
    () => getAchievements(transactions, monthlyStats, streak),
    [transactions, monthlyStats, streak]
  );

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const levelProgress = level.nextThreshold
    ? Math.min((level.currentAvg / level.nextThreshold) * 100, 100)
    : 100;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3">No achievements yet</h2>
        <p className="text-muted-foreground max-w-sm leading-relaxed">
          Start tracking your finances to unlock achievements and level up your financial discipline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-achievements-title">Achievements</h1>
        <p className="text-muted-foreground text-sm">
          {unlockedCount} of {achievements.length} unlocked
        </p>
      </div>

      {/* Level & Streak Hero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-primary/5" data-testid="card-level-hero">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/15">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Financial Level</p>
                <p className="text-lg font-bold">
                  Level {level.level} <span className="text-primary">· {level.title}</span>
                </p>
              </div>
            </div>
            <Progress value={levelProgress} className="h-2 mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{fmt(level.currentAvg)}% avg savings</span>
              <span>{level.nextThreshold ? `${level.nextThreshold}% to next` : "Max level"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-orange-500/5" data-testid="card-streak-hero">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-orange-500/15">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Savings Streak</p>
                <p className="text-lg font-bold">
                  {streak} <span className="text-orange-400">{streak === 1 ? "month" : "months"}</span>
                </p>
              </div>
            </div>
            <Progress value={Math.min((streak / 6) * 100, 100)} className="h-2 mb-2 [&>div]:bg-orange-400" />
            <p className="text-xs text-muted-foreground">
              {streak === 0
                ? "Spend less than you earn to start"
                : streak >= 6
                ? "Six-month streak — outstanding discipline"
                : `${6 - streak} more ${6 - streak === 1 ? "month" : "months"} to reach the 6-month goal`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card data-testid="card-overall-progress">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Overall Progress</p>
            <span className="text-sm text-primary font-semibold">{unlockedCount}/{achievements.length}</span>
          </div>
          <Progress value={(unlockedCount / achievements.length) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {achievements.length - unlockedCount} achievements still to unlock
          </p>
        </CardContent>
      </Card>

      {/* Achievement Grid */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Unlocked ({unlockedCount})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {achievements
            .filter((a) => a.isUnlocked)
            .map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
        </div>

        {achievements.some((a) => !a.isUnlocked) && (
          <>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Locked ({achievements.length - unlockedCount})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements
                .filter((a) => !a.isUnlocked)
                .map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
