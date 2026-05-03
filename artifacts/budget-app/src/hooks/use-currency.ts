import { createContext, useContext, useState, useEffect, ReactNode, createElement } from "react";

export type CurrencyCode = "USD" | "EUR";

interface CurrencyContextValue {
  currency: CurrencyCode;
  symbol: string;
  setCurrency: (c: CurrencyCode) => void;
  fmt: (n: number) => string;
}

const STORAGE_KEY = "vault-currency";

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  symbol: "$",
  setCurrency: () => {},
  fmt: (n) => n.toFixed(2),
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === "USD" || saved === "EUR") ? saved : "USD";
  });

  const setCurrency = (c: CurrencyCode) => {
    localStorage.setItem(STORAGE_KEY, c);
    setCurrencyState(c);
  };

  const symbol = currency === "EUR" ? "€" : "$";

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return createElement(
    CurrencyContext.Provider,
    { value: { currency, symbol, setCurrency, fmt } },
    children
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
