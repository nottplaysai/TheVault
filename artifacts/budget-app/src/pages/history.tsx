import { useState, useMemo } from "react";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Trash2, TrendingUp, TrendingDown, PiggyBank, Search, Filter } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { useCurrency } from "@/hooks/use-currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const TYPE_ICONS = {
  income: TrendingUp,
  expense: TrendingDown,
  investment: PiggyBank,
};

const TYPE_COLORS: Record<string, string> = {
  income: "text-emerald-500",
  expense: "text-red-400",
  investment: "text-primary",
};

const TYPE_BG: Record<string, string> = {
  income: "bg-emerald-500/10",
  expense: "bg-red-500/10",
  investment: "bg-primary/10",
};

function getMonthOptions() {
  const months: { label: string; value: string }[] = [{ label: "All time", value: "all" }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = subMonths(now, i);
    months.push({ label: format(d, "MMMM yyyy"), value: format(d, "yyyy-MM") });
  }
  return months;
}

export function History() {
  const { transactions, isLoading, deleteTx } = useTransactions();
  const { symbol, fmt } = useCurrency();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((tx) => {
        if (typeFilter !== "all" && tx.type !== typeFilter) return false;
        if (monthFilter !== "all") {
          const month = tx.date.substring(0, 7);
          if (month !== monthFilter) return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          if (
            !tx.category.toLowerCase().includes(q) &&
            !(tx.name || "").toLowerCase().includes(q) &&
            !(tx.note || "").toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      });
  }, [transactions, typeFilter, monthFilter, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteTx(deleteId);
    setDeleteId(null);
    toast({ title: "Deleted", description: "Transaction removed from your vault." });
  };

  const monthOptions = getMonthOptions();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-history-title">History</h1>
        <p className="text-muted-foreground text-sm">{transactions.length} total transactions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-36" data-testid="select-type-filter">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
            <SelectItem value="investment">Investments</SelectItem>
          </SelectContent>
        </Select>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-month-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-xl bg-muted mx-auto flex items-center justify-center mb-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {transactions.length === 0 ? "No transactions yet" : "No transactions match your filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => {
            const Icon = TYPE_ICONS[tx.type];
            return (
              <Card
                key={tx.id}
                data-testid={`card-transaction-${tx.id}`}
                className="border-border"
              >
                <CardContent className="py-4 flex items-center gap-4">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${TYPE_BG[tx.type]}`}>
                    <Icon className={`w-4 h-4 ${TYPE_COLORS[tx.type]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.name || tx.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.name ? `${tx.category} · ` : ""}{format(parseISO(tx.date), "MMM d, yyyy")}
                      {tx.note ? ` · ${tx.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-sm font-semibold tabular-nums ${TYPE_COLORS[tx.type]}`}>
                      {tx.type === "income" ? "+" : "-"}{symbol}{fmt(tx.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(tx.id)}
                      data-testid={`button-delete-${tx.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove it from your vault. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
