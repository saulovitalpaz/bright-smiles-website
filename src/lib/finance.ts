export const financePeriodQuery = (month: number, year: number) =>
  new URLSearchParams({ month: String(month), year: String(year) }).toString();

export const financePeriodTitle = (month: number, year: number) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })
    .format(new Date(Date.UTC(year, month - 1, 15)));

type ExpenseTransaction = {
  type: 'income' | 'expense';
  category: string | null;
  amount: number;
  paymentStatus?: string | null;
};

export const todayInput = (date = new Date()) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

export const createExpenseCategorySummary = (transactions: ExpenseTransaction[]) => {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    const category = transaction.category?.trim();
    if (transaction.type !== 'expense' || transaction.paymentStatus === 'voided' || !category || !Number.isFinite(transaction.amount) || transaction.amount <= 0) continue;
    totals.set(category, (totals.get(category) || 0) + transaction.amount);
  }

  const totalExpense = Array.from(totals.values()).reduce((total, amount) => total + amount, 0);
  return Array.from(totals, ([name, amount]) => ({
    name,
    amount,
    percentage: totalExpense ? (amount / totalExpense) * 100 : 0,
  })).sort((first, second) => second.amount - first.amount);
};
