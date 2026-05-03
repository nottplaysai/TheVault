import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, PiggyBank, CheckCircle } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { useCurrency } from "@/hooks/use-currency";
import { Transaction } from "@/lib/db";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const INCOME_CATEGORIES = ["Salary", "Freelance", "Commissions", "Business", "Investments", "Gifts", "Other"];
const EXPENSE_CATEGORIES = ["Food", "Rent", "Transport", "Entertainment", "Shopping", "Healthcare", "Utilities", "Education", "Subscriptions", "Other"];
const INVESTMENT_TYPES = ["Stocks", "Crypto", "ETF", "Savings", "Real Estate", "Bonds", "Other"];

const transactionSchema = z.object({
  name: z.string().optional(),
  category: z.string().min(1, "Please select a category"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  note: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

type TabType = "income" | "expense" | "investment";

const tabs: { id: TabType; label: string; icon: React.ElementType; color: string; activeClass: string }[] = [
  { id: "income", label: "Income", icon: TrendingUp, color: "text-emerald-500", activeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  { id: "expense", label: "Expense", icon: TrendingDown, color: "text-red-400", activeClass: "bg-red-500/10 text-red-400 border-red-500/30" },
  { id: "investment", label: "Invest", icon: PiggyBank, color: "text-primary", activeClass: "bg-primary/10 text-primary border-primary/30" },
];

export function AddTransaction() {
  const [activeTab, setActiveTab] = useState<TabType>("income");
  const [submitted, setSubmitted] = useState(false);
  const { addTx } = useTransactions();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { symbol, fmt } = useCurrency();

  const form = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      name: "",
      category: "",
      amount: undefined as unknown as number,
      date: format(new Date(), "yyyy-MM-dd"),
      note: "",
    },
  });

  const categories =
    activeTab === "income" ? INCOME_CATEGORIES : activeTab === "expense" ? EXPENSE_CATEGORIES : INVESTMENT_TYPES;

  const onTabChange = (tab: TabType) => {
    setActiveTab(tab);
    form.reset({ name: "", category: "", amount: undefined as unknown as number, date: format(new Date(), "yyyy-MM-dd"), note: "" });
    setSubmitted(false);
  };

  const onSubmit = async (data: TransactionForm) => {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      type: activeTab,
      category: data.category,
      amount: data.amount,
      date: data.date,
      note: data.note || undefined,
      name: data.name || undefined,
    };
    try {
      await addTx(tx);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        form.reset({ name: "", category: "", amount: undefined as unknown as number, date: format(new Date(), "yyyy-MM-dd"), note: "" });
      }, 1500);
      toast({ title: "Transaction saved", description: `${symbol}${data.amount.toFixed(2)} recorded.` });
    } catch {
      toast({ title: "Error", description: "Failed to save transaction.", variant: "destructive" });
    }
  };

  const activeTabConfig = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-add-title">Add Transaction</h1>
        <p className="text-muted-foreground text-sm">Record income, spending, or investments</p>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-3 gap-2" data-testid="tab-type-selector">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            data-testid={`button-tab-${tab.id}`}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
              activeTab === tab.id
                ? tab.activeClass
                : "border-border text-muted-foreground hover:border-muted-foreground/50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-card rounded-2xl border border-border p-6">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className={`w-14 h-14 mb-4 ${activeTabConfig.color}`} />
            <p className="text-lg font-semibold">Saved!</p>
            <p className="text-sm text-muted-foreground">Transaction recorded to your vault</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {activeTab === "income" && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Monthly salary, Client project..."
                          {...field}
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} data-testid={`option-category-${cat}`}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ({symbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        {...field}
                        data-testid="input-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional details..."
                        rows={2}
                        {...field}
                        data-testid="textarea-note"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
                data-testid="button-submit"
              >
                {form.formState.isSubmitting ? "Saving..." : `Save ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
