import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, ArrowRight, CheckCircle2, PieChart, Users, Receipt } from 'lucide-react';
import { EventItinerary, ExpenseItem } from '../types';

interface GroupExpensesViewProps {
  itineraries: EventItinerary[];
  setItineraries: React.Dispatch<React.SetStateAction<EventItinerary[]>>;
}

export const GroupExpensesView: React.FC<GroupExpensesViewProps> = ({
  itineraries,
  setItineraries,
}) => {
  const [activePlanIdx, setActivePlanIdx] = useState(0);
  const activePlan = itineraries[activePlanIdx] || itineraries[0];

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [category, setCategory] = useState<ExpenseItem['category']>('Tickets');
  const [splitWithAll, setSplitWithAll] = useState(true);

  if (!activePlan) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
        <Receipt className="w-12 h-12 mx-auto text-rose-400 mb-3" />
        <p>No active itinerary found. Create or add an event to track split expenses.</p>
      </div>
    );
  }

  // Ensure default payer is first crew member
  const defaultPayerId = payerId || (activePlan.crew[0]?.id ?? '');

  // Calculate totals and settlement balances
  const totalSpent = activePlan.expenses.reduce((sum, item) => sum + item.amount, 0);

  // Settlement matrix
  // balance: positive means they paid more than their share (owed money); negative means they owe money.
  const balances: { [memberId: string]: number } = {};
  activePlan.crew.forEach((m) => {
    balances[m.id] = 0;
  });

  activePlan.expenses.forEach((expense) => {
    const splitCount = expense.splitAmongIds.length || activePlan.crew.length;
    const share = expense.amount / splitCount;

    // The payer gets credited
    if (balances[expense.payerId] !== undefined) {
      balances[expense.payerId] += expense.amount;
    }

    // Each person splitting gets debited
    const splittingList = expense.splitAmongIds.length > 0 ? expense.splitAmongIds : activePlan.crew.map((c) => c.id);
    splittingList.forEach((id) => {
      if (balances[id] !== undefined) {
        balances[id] -= share;
      }
    });
  });

  // Calculate settlement transactions
  // Greedily match debtors to creditors
  const debtors = Object.entries(balances)
    .filter(([_, bal]) => bal < -0.01)
    .map(([id, bal]) => ({ id, amount: -bal }));

  const creditors = Object.entries(balances)
    .filter(([_, bal]) => bal > 0.01)
    .map(([id, bal]) => ({ id, amount: bal }));

  const settlements: { from: string; to: string; amount: number }[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const settleAmt = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: activePlan.crew.find((c) => c.id === debtor.id)?.name || 'Crew Member',
      to: activePlan.crew.find((c) => c.id === creditor.id)?.name || 'Crew Member',
      amount: settleAmt,
    });

    debtor.amount -= settleAmt;
    creditor.amount -= settleAmt;

    if (debtor.amount < 0.01) dIdx++;
    if (creditor.amount < 0.01) cIdx++;
  }

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!title.trim() || isNaN(numAmt) || numAmt <= 0) return;

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      title: title.trim(),
      amount: numAmt,
      payerId: defaultPayerId,
      category,
      splitAmongIds: activePlan.crew.map((c) => c.id),
    };

    setItineraries((prev) =>
      prev.map((plan, idx) =>
        idx === activePlanIdx
          ? { ...plan, expenses: [...plan.expenses, newExpense] }
          : plan
      )
    );

    setTitle('');
    setAmount('');
  };

  const handleDeleteExpense = (id: string) => {
    setItineraries((prev) =>
      prev.map((plan, idx) =>
        idx === activePlanIdx
          ? { ...plan, expenses: plan.expenses.filter((e) => e.id !== id) }
          : plan
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Group Budget & Fair Split
            </span>
            <span className="text-xs text-slate-400">Zero awkward math at 3 AM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
            Split & Budget Calculator
          </h1>
        </div>

        {/* Switch plan */}
        {itineraries.length > 1 && (
          <div className="flex gap-2">
            {itineraries.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActivePlanIdx(i)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  activePlanIdx === i
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                {p.eventTitle}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Group Spend</p>
          <p className="text-2xl sm:text-3xl font-bold font-display text-white">${totalSpent.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500">Across {activePlan.expenses.length} shared expenses</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Per Person Average</p>
          <p className="text-2xl sm:text-3xl font-bold font-display text-amber-400">
            ${(activePlan.crew.length ? totalSpent / activePlan.crew.length : 0).toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500">Split among {activePlan.crew.length} crew members</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Transfers</p>
          <p className="text-2xl sm:text-3xl font-bold font-display text-emerald-400">
            {settlements.length} Transfers
          </p>
          <p className="text-[11px] text-slate-500">Auto-balanced settlement paths</p>
        </div>
      </div>

      {/* Main Grid: Add & List Expenses / Settlement Paths */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Add & Expense List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Add Expense Form */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-rose-400" />
              Record An Expense
            </h3>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Expense Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. VIP Tickets (SeatGeek), Uber XL, Tequila round"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Paid By</label>
                  <select
                    value={defaultPayerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    {activePlan.crew.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.status === 'host' ? '(Host)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Tickets">Tickets & Entry</option>
                    <option value="Rideshare">Uber / Lyft / Rideshare</option>
                    <option value="Drinks / Food">Drinks, Bars & Food</option>
                    <option value="Hotel">Hotel / Airbnb</option>
                    <option value="Other">Other Nightlife Gear</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Splitting evenly with all <b>{activePlan.crew.length} crew members</b>
                </span>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-110 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>

          {/* Expense History Table */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Expense Log ({activePlan.expenses.length})
            </h3>

            {activePlan.expenses.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No expenses added yet.</p>
            ) : (
              <div className="space-y-2.5">
                {activePlan.expenses.map((item) => {
                  const payer = activePlan.crew.find((c) => c.id === item.payerId)?.name || 'Crew Member';
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 text-xs sm:text-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{item.title}</span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Paid by <b className="text-rose-400">{payer}</b> • Split among {item.splitAmongIds.length || activePlan.crew.length}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold font-display text-white">
                          ${item.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Col: Who Owes Who Settlement */}
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Algorithmically Optimized
              </span>
              <h3 className="text-base font-bold text-white font-display mt-2">
                Settlement Transfers
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Minimal transactions required to settle all debts in full:
              </p>
            </div>

            {settlements.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-emerald-300">All Balances Settled Evenly!</p>
                <p className="text-[11px] text-slate-400">No pending transfers needed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-rose-300 font-semibold">
                        <span>{s.from}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-emerald-300">{s.to}</span>
                      </div>
                      <span className="font-bold font-display text-white text-sm">
                        ${s.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                      <span className="text-[10px] text-slate-500">Venmo / Zelle / Cash App</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`Hey ${s.from}, you owe ${s.to} $${s.amount.toFixed(2)} for ${activePlan.eventTitle} on AfterGlow!`);
                          alert(`Copied payment request link for ${s.from}!`);
                        }}
                        className="text-[10px] font-semibold text-rose-400 hover:text-rose-300"
                      >
                        Request Payment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
