import { openDB } from 'idb';

export interface Transaction {
  id: string;           // UUID
  type: 'income' | 'expense' | 'investment';
  category: string;
  amount: number;       // always positive
  date: string;         // ISO date string YYYY-MM-DD
  note?: string;
  name?: string;        // for income: source name
}

export const DB_NAME = 'vault-budget';
export const DB_VERSION = 1;

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('by-type', 'type');
        store.createIndex('by-date', 'date');
      }
    },
  });
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAll('transactions');
}

export async function addTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', tx);
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('transactions', id);
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', tx);
}

export async function importData(transactions: Transaction[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('transactions', 'readwrite');
  await Promise.all([
    ...transactions.map(t => tx.store.put(t)),
    tx.done
  ]);
}
