"use client";

import { useMemo, useState, useTransition } from "react";
import { Button, Chip, EmptyState, Field, Input, Label, Stack, ViewHeader } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { createTransaction, deleteTransaction } from "@/app/actions/money";
import type { Transaction } from "@/lib/types";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function fmtMoney(n: number, currency: string) {
  const sign = n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
}

export function MoneyClient({ initialTransactions, currency }: { initialTransactions: Transaction[]; currency: string }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [, startTransition] = useTransition();
  const toast = useToast();

  const income = transactions.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
  const balance = income - expense;

  const now = new Date();
  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date + "T00:00:00");
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthIncome = monthTx.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const monthExpense = monthTx.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);

  const list = useMemo(() => {
    let l = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    if (filter !== "all") l = l.filter((t) => t.type === filter);
    return l;
  }, [transactions, filter]);

  async function handleDelete(t: Transaction) {
    setTransactions((prev) => prev.filter((x) => x.id !== t.id));
    startTransition(async () => deleteTransaction(t.id));
    toast.show("Transaction deleted.");
  }

  return (
    <div>
      <ViewHeader
        eyebrow={currency}
        title="Money"
        action={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            <PlusIcon /> Add transaction
          </Button>
        }
      />

      {transactions.length === 0 ? (
        <EmptyState
          icon={<MoneyIcon />}
          title="No transactions yet."
          description="Log income or an expense to start tracking your balance."
          action={
            <Button variant="primary" className="mt-2" onClick={() => setModalOpen(true)}>
              <PlusIcon /> Add transaction
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex items-end justify-between gap-5 border-t border-[var(--line)] py-5">
            <span className="text-[13.5px] text-[var(--ink-soft)]">Balance</span>
            <span className="font-mono text-[26px] tracking-tight" style={{ color: balance < 0 ? "var(--danger)" : "var(--ink)" }}>
              {fmtMoney(balance, currency)}
            </span>
          </div>
          <div className="flex items-end justify-between gap-5 border-t border-[var(--line)] py-5">
            <span className="text-[13.5px] text-[var(--ink-soft)]">This month — in / out</span>
            <span className="font-mono text-[17px]">
              {fmtMoney(monthIncome, currency)} / {fmtMoney(monthExpense, currency)}
            </span>
          </div>

          <div className="mb-3.5 mt-9 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">History</div>
          <div className="mb-5 flex gap-2">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </Chip>
            <Chip active={filter === "income"} onClick={() => setFilter("income")}>
              Income
            </Chip>
            <Chip active={filter === "expense"} onClick={() => setFilter("expense")}>
              Expenses
            </Chip>
          </div>

          <Stack>
            {list.map((t) => (
              <div key={t.id} className="flex items-center gap-3.5 py-3.5 group">
                <div className="flex-1 min-w-0">
                  <div className="text-[14.5px]">{t.category || (t.type === "income" ? "Income" : "Expense")}</div>
                  <div className="text-xs text-[var(--ink-faint)]">
                    {fmtDate(t.date)}
                    {t.notes ? ` · ${t.notes}` : ""}
                  </div>
                </div>
                <div className="font-mono text-sm" style={{ color: t.type === "income" ? "var(--good)" : "var(--danger)" }}>
                  {t.type === "income" ? "+" : "-"}
                  {fmtMoney(t.amount, currency).replace("-", "")}
                </div>
                <button
                  onClick={() => handleDelete(t)}
                  aria-label="Delete"
                  className="flex h-[30px] w-[30px] items-center justify-center rounded text-[var(--ink-faint)] opacity-0 transition-opacity hover:bg-black/5 hover:text-[var(--ink)] group-hover:opacity-100"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </Stack>
        </>
      )}

      <TxModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(t) => setTransactions((prev) => [t, ...prev])}
      />
    </div>
  );
}

function TxModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (t: Transaction) => void }) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    await createTransaction({ type, amount: amt, date, category, notes });
    onCreated({
      id: crypto.randomUUID(),
      user_id: "",
      type,
      amount: amt,
      date,
      category: category || null,
      notes: notes || null,
    });
    toast.show("Transaction added.");
    setAmount("");
    setCategory("");
    setNotes("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add transaction">
      <form onSubmit={handleSubmit}>
        <Field>
          <Label>Type</Label>
          <div className="flex gap-2">
            <Chip active={type === "expense"} onClick={() => setType("expense")}>
              Expense
            </Chip>
            <Chip active={type === "income"} onClick={() => setType("income")}>
              Income
            </Chip>
          </div>
        </Field>
        <div className="flex gap-3">
          <Field>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="txDate">Date</Label>
            <Input id="txDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field>
          <Label htmlFor="txCategory">Category</Label>
          <Input id="txCategory" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Food, Transport, Salary" />
        </Field>
        <Field>
          <Label htmlFor="txNotes">Notes (optional)</Label>
          <Input id="txNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="mt-5 flex justify-end gap-2.5 border-t border-[var(--line)] pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.5 9.8c0-1 1-1.8 2.5-1.8s2.5.9 2.5 2c0 2.4-5 1.4-5 3.8 0 1.1 1.1 2 2.5 2s2.5-.7 2.5-1.8" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.8 12.1a1 1 0 0 1-1 .9H7.8a1 1 0 0 1-1-.9L6 7" />
    </svg>
  );
}
