import { useRef } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, DollarSign, Euro, Download, Upload } from "lucide-react";
import { useCurrency, CurrencyCode } from "@/hooks/use-currency";
import { useTransactions } from "@/hooks/use-transactions";
import { Transaction } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { transactions, importTx } = useTransactions();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = JSON.stringify(transactions, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Backup saved", description: `${transactions.length} transactions exported.` });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Transaction[];
      if (!Array.isArray(data)) throw new Error("Invalid format");
      await importTx(data);
      toast({ title: "Backup restored", description: `${data.length} transactions loaded.` });
    } catch {
      toast({ title: "Import failed", description: "The file doesn't look like a Vault backup.", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const currencies: { code: CurrencyCode; label: string; symbol: string; icon: React.ElementType }[] = [
    { code: "USD", label: "US Dollar", symbol: "$", icon: DollarSign },
    { code: "EUR", label: "Euro", symbol: "€", icon: Euro },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground text-sm">Customize how Vault looks and works</p>
      </div>

      {/* Appearance */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</h2>
        <Card>
          <CardContent className="pt-5 pb-5 space-y-3">
            <p className="text-sm font-medium">Theme</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme("light")}
                data-testid="button-theme-light"
                className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                  theme === "light"
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                data-testid="button-theme-dark"
                className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                  theme === "dark"
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Currency */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Currency</h2>
        <Card>
          <CardContent className="pt-5 pb-5 space-y-3">
            <p className="text-sm font-medium">Display currency</p>
            <div className="grid grid-cols-2 gap-3">
              {currencies.map(({ code, label, symbol, icon: Icon }) => (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  data-testid={`button-currency-${code.toLowerCase()}`}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                    currency === code
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                  }`}
                >
                  <span className={`text-lg font-bold leading-none ${currency === code ? "text-primary" : "text-muted-foreground"}`}>
                    {symbol}
                  </span>
                  <div className="text-left">
                    <p className={`text-sm font-semibold leading-none ${currency === code ? "text-primary" : "text-foreground"}`}>{code}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              This changes the symbol displayed — Vault does not convert amounts.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Data */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</h2>
        <Card>
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Export backup</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Save all your transactions as a file on your device. Use this to keep a copy safe or move to another browser.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={handleExport}
                data-testid="button-export"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Import backup</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Restore your transactions from a previously exported Vault backup file.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-import"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Privacy note */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Privacy</h2>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-sm font-medium mb-1">100% local storage</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All your financial data is stored exclusively in this browser's IndexedDB. Nothing is ever sent to a server, synced to the cloud, or shared with any third party.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
