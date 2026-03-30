import React, { createContext, useContext, useState, useCallback } from "react";
import { Group, Expense, ExpenseSplit, Settlement, categorizeExpense } from "@/types/expense";

interface AppContextType {
  groups: Group[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  createGroup: (name: string, memberNames: string[]) => Group;
  deleteGroup: (id: string) => void;
  addMember: (groupId: string, name: string) => void;
  addExpense: (groupId: string, description: string, amount: number, paidBy: string, splits: ExpenseSplit[]) => void;
  editExpense: (groupId: string, expenseId: string, description: string, amount: number, paidBy: string, splits: ExpenseSplit[]) => void;
  deleteExpense: (groupId: string, expenseId: string) => void;
  settleBalance: (groupId: string, from: string, to: string, amount: number) => void;
  getGroup: (id: string) => Group | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const STORAGE_KEY = "expense-splitter-data";

function loadGroups(): Group[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const groups = data ? JSON.parse(data) : [];
    // Migrate old groups without settlements
    return groups.map((g: any) => ({ ...g, settlements: g.settlements || [] }));
  } catch {
    return [];
  }
}

function saveGroups(groups: Group[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(loadGroups);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const persist = useCallback((newGroups: Group[]) => {
    setGroups(newGroups);
    saveGroups(newGroups);
  }, []);

  const createGroup = useCallback((name: string, memberNames: string[]) => {
    const group: Group = {
      id: generateId(),
      name,
      members: memberNames.map((n) => ({ id: generateId(), name: n })),
      expenses: [],
      settlements: [],
      createdAt: new Date().toISOString(),
    };
    const newGroups = [...groups, group];
    persist(newGroups);
    return group;
  }, [groups, persist]);

  const deleteGroup = useCallback((id: string) => {
    persist(groups.filter((g) => g.id !== id));
    if (activeGroupId === id) setActiveGroupId(null);
  }, [groups, persist, activeGroupId]);

  const addMember = useCallback((groupId: string, name: string) => {
    persist(
      groups.map((g) =>
        g.id === groupId ? { ...g, members: [...g.members, { id: generateId(), name }] } : g
      )
    );
  }, [groups, persist]);

  const addExpense = useCallback((groupId: string, description: string, amount: number, paidBy: string, splits: ExpenseSplit[]) => {
    const expense: Expense = {
      id: generateId(),
      groupId,
      description,
      amount,
      paidBy,
      splits,
      category: categorizeExpense(description),
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    persist(
      groups.map((g) =>
        g.id === groupId ? { ...g, expenses: [...g.expenses, expense] } : g
      )
    );
  }, [groups, persist]);

  const editExpense = useCallback((groupId: string, expenseId: string, description: string, amount: number, paidBy: string, splits: ExpenseSplit[]) => {
    persist(
      groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              expenses: g.expenses.map((e) =>
                e.id === expenseId
                  ? { ...e, description, amount, paidBy, splits, category: categorizeExpense(description) }
                  : e
              ),
            }
          : g
      )
    );
  }, [groups, persist]);

  const deleteExpense = useCallback((groupId: string, expenseId: string) => {
    persist(
      groups.map((g) =>
        g.id === groupId ? { ...g, expenses: g.expenses.filter((e) => e.id !== expenseId) } : g
      )
    );
  }, [groups, persist]);

  const settleBalance = useCallback((groupId: string, from: string, to: string, amount: number) => {
    const settlement: Settlement = {
      id: generateId(),
      from,
      to,
      amount,
      settledAt: new Date().toISOString(),
    };
    persist(
      groups.map((g) =>
        g.id === groupId ? { ...g, settlements: [...g.settlements, settlement] } : g
      )
    );
  }, [groups, persist]);

  const getGroup = useCallback((id: string) => groups.find((g) => g.id === id), [groups]);

  return (
    <AppContext.Provider
      value={{ groups, activeGroupId, setActiveGroupId, createGroup, deleteGroup, addMember, addExpense, editExpense, deleteExpense, settleBalance, getGroup }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
