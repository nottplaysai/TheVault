import { useState, useEffect } from "react";
import { Transaction, getAllTransactions, addTransaction, deleteTransaction, updateTransaction, importData } from "../lib/db";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await getAllTransactions();
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const addTx = async (tx: Transaction) => {
    await addTransaction(tx);
    await loadTransactions();
  };

  const deleteTx = async (id: string) => {
    await deleteTransaction(id);
    await loadTransactions();
  };

  const updateTx = async (tx: Transaction) => {
    await updateTransaction(tx);
    await loadTransactions();
  };

  const importTx = async (data: Transaction[]) => {
    await importData(data);
    await loadTransactions();
  };

  return {
    transactions,
    isLoading,
    error,
    addTx,
    deleteTx,
    updateTx,
    importTx,
    refresh: loadTransactions,
  };
}
