import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import { Trash2, UserPlus, FileSpreadsheet, Activity, Trash, Plus } from 'lucide-react';

export const DashboardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [balances, setBalances] = useState<{ netBalances: any, simplifiedDebts: any[] }>({ netBalances: {}, simplifiedDebts: [] });
  const [loading, setLoading] = useState(true);
  
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Settle Form State
  const [settleFrom, setSettleFrom] = useState('');
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleDate, setSettleDate] = useState('');

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviteDate, setInviteDate] = useState('');

  // Expense Form State
  const [expDesc, setExpDesc] = useState('');
  const [expDate, setExpDate] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCurrency, setExpCurrency] = useState('INR');
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expSplitType, setExpSplitType] = useState('EQUAL');
  const [expNotes, setExpNotes] = useState('');
  const [expSelectedMembers, setExpSelectedMembers] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const [grpRes, expRes, memRes, balRes] = await Promise.all([
        api.get(`/groups`), // HACK: In real app we'd have GET /groups/:id
        api.get(`/groups/${id}/expenses`),
        api.get(`/groups/${id}/members`),
        api.get(`/groups/${id}/balances`)
      ]);
      const currentGroup = grpRes.data.find((g: any) => g.id === id) || { name: 'DEMO TRIP' };
      setGroup(currentGroup);
      setExpenses(expRes.data);
      setMembers(memRes.data);
      setBalances(balRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleSettle = async () => {
    try {
      await api.post('/settlements', {
        groupId: id,
        paidById: settleFrom,
        paidToId: settleTo,
        amount: parseFloat(settleAmount),
        currencyCode: 'INR',
        date: settleDate || new Date().toISOString()
      });
      setShowSettleModal(false);
      fetchData();
    } catch (e) {
      alert('Failed to settle up');
    }
  };

  const handleInvite = async () => {
    try {
      await api.post(`/groups/${id}/members`, {
        email: inviteEmail,
        joinDate: inviteDate || new Date().toISOString()
      });
      setShowInviteModal(false);
      fetchData();
    } catch (e) {
      alert('Failed to invite member');
    }
  };

  const handleAddExpense = async () => {
    try {
      // Setup participants for equal split
      const participants = expSelectedMembers.map(userId => ({
        userId,
        splitValue: 1 // for EQUAL, value doesn't matter as much, backend handles it if we pass equally
      }));

      await api.post('/expenses', {
        groupId: id,
        paidById: expPaidBy,
        amount: parseFloat(expAmount),
        splitType: expSplitType,
        date: expDate || new Date().toISOString(),
        description: expDesc,
        notes: expNotes,
        participants
      });
      setShowExpenseModal(false);
      fetchData();
    } catch (e) {
      alert('Failed to add expense');
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setExpSelectedMembers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-bold uppercase tracking-wider text-sm">Loading...</div>;

  return (
    <div className="min-h-screen bg-white font-['Inter'] flex flex-col">
      <TopNav />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Breadcrumbs */}
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <span>Home</span>
          <span>Created by Aisha</span>
        </div>

        {/* Toolbar & Title */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide mb-2">{group?.name || 'Group'}</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {balances.simplifiedDebts.length === 0 ? 'YOU ARE FULLY SETTLED UP' : 'OUTSTANDING BALANCES EXIST'}
            </p>
          </div>

          <div className="flex space-x-2">
            <button 
              onClick={() => setShowExpenseModal(true)}
              className="bg-[#4f46e5] text-white px-4 py-2 font-bold text-xs uppercase tracking-wider hover:bg-[#4338ca] transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Expense
            </button>
            <button 
              onClick={() => setShowSettleModal(true)}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors"
            >
              Settle Up
            </button>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> Invite Member
            </button>
            <button 
              onClick={() => navigate(`/groups/${id}/import`)}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Import CSV
            </button>
            <button 
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this group and all its data? This cannot be undone.')) {
                  try {
                    await api.delete(`/groups/${id}`);
                    navigate('/groups');
                  } catch (e) {
                    alert('Failed to delete group');
                  }
                }
              }}
              className="bg-red-600 text-white px-4 py-2 font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-colors flex items-center ml-4"
            >
              <Trash className="w-4 h-4 mr-1.5" /> Delete Group
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Col: Expense History */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Expense History</h2>
            <div className="border-t border-gray-200">
              {expenses.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">No expenses logged yet.</div>
              ) : (
                expenses.map((exp: any, idx) => {
                  const d = new Date(exp.date);
                  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                  return (
                    <div key={idx} className="flex items-center py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors px-2">
                      <div className="flex flex-col items-center justify-center w-12 h-12 bg-gray-100 mr-4">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{month}</span>
                        <span className="text-sm font-black text-gray-900">{d.getDate()}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
                          {exp.type === 'SETTLEMENT' ? 'Settlement Payment' : exp.description || 'Expense'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Paid by <span className="font-bold text-gray-700">{exp.paidBy?.name}</span>
                          {exp.type === 'EXPENSE' && ` · ${exp.splitType?.toLowerCase()} split`}
                          {exp.notes && ` · Note: "${exp.notes}"`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-black text-gray-900">
                          {exp.originalCurrencyCode === 'INR' ? '₹' : exp.originalCurrencyCode} 
                          {Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </span>
                        <button className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Col: Members & Balances */}
          <div className="space-y-10">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Group Members</h2>
              <div className="border border-gray-200">
                {members.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0 bg-white hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                         <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${m.user?.name || 'User'}`} alt="avatar" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{m.user?.name}</p>
                        <p className="text-[10px] text-gray-400">{m.user?.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#4f46e5] uppercase tracking-wider">
                      {m.leaveDate ? `LEFT: ${new Date(m.leaveDate).toLocaleDateString()}` : (idx === 0 ? 'ADMIN' : 'MEMBER')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Balances Ledger</h2>
              <div className="border border-gray-200 bg-white p-4">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Settlements Breakdown</h3>
                {balances.simplifiedDebts.length === 0 ? (
                  <p className="text-xs text-gray-500">No pending settlements.</p>
                ) : (
                  <div className="space-y-3">
                    {balances.simplifiedDebts.map((d, idx) => {
                      const fromUser = members.find(m => m.user.id === d.fromUserId)?.user.name || d.fromUserId;
                      const toUser = members.find(m => m.user.id === d.toUserId)?.user.name || d.toUserId;
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{fromUser}</span>
                          <span className="text-gray-400 mx-2">owes</span>
                          <span className="font-bold text-gray-700">{toUser}</span>
                          <span className="font-black text-gray-900 ml-auto">₹{d.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODALS */}

        {/* Settlement Modal overlay */}
        {showSettleModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md p-8">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-6 border-b border-gray-200 pb-3">Record Settlement Payment</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">From (Who Paid) *</label>
                  <select value={settleFrom} onChange={e => setSettleFrom(e.target.value)} className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5]">
                    <option value="">Select User</option>
                    {members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">To (Who Received) *</label>
                  <select value={settleTo} onChange={e => setSettleTo(e.target.value)} className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5]">
                    <option value="">Select User</option>
                    {members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Amount (₹ INR) *</label>
                  <input type="number" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} placeholder="e.g. 5000" className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Date</label>
                  <input type="date" value={settleDate} onChange={e => setSettleDate(e.target.value)} className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5]" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-8">
                <button onClick={() => setShowSettleModal(false)} className="bg-white border border-gray-900 text-gray-900 px-6 py-2.5 font-bold text-xs uppercase tracking-wider hover:bg-gray-50">Cancel</button>
                <button onClick={handleSettle} className="bg-[#4f46e5] text-white px-6 py-2.5 font-bold text-xs uppercase tracking-wider hover:bg-[#4338ca]">Save Payment</button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Member Modal overlay */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md p-8">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-6 border-b border-gray-200 pb-3">Invite Member To Group</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Email Address *</label>
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="e.g. sam@example.com" className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Role</label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5]">
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Join Date</label>
                  <input type="date" value={inviteDate} onChange={e => setInviteDate(e.target.value)} className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5]" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-8">
                <button onClick={() => setShowInviteModal(false)} className="bg-white border border-gray-900 text-gray-900 px-6 py-2.5 font-bold text-xs uppercase tracking-wider hover:bg-gray-50">Cancel</button>
                <button onClick={handleInvite} className="bg-[#4f46e5] text-white px-6 py-2.5 font-bold text-xs uppercase tracking-wider hover:bg-[#4338ca]">Add Member</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Modal overlay */}
        {showExpenseModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-lg p-8">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-6 border-b border-gray-200 pb-3">Add Expense</h2>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Description *</label>
                    <input type="text" value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="e.g. Swiggy Dinner" className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Date</label>
                    <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5]" />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Amount *</label>
                    <input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Currency</label>
                    <select value={expCurrency} onChange={e => setExpCurrency(e.target.value)} className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5]">
                      <option value="INR">₹ INR</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Paid By *</label>
                    <select value={expPaidBy} onChange={e => setExpPaidBy(e.target.value)} className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5]">
                      <option value="">Select User</option>
                      {members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Split Type</label>
                    <select value={expSplitType} onChange={e => setExpSplitType(e.target.value)} className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5]">
                      <option value="EQUAL">Split Equally</option>
                      <option value="EXACT">Split by Exact Amounts</option>
                      <option value="PERCENTAGE">Split by Percentage</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Notes</label>
                  <textarea value={expNotes} onChange={e => setExpNotes(e.target.value)} placeholder="e.g. Swiggy coupon applied" className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-[#4f46e5] h-16" />
                </div>

                <div className="bg-gray-50 border border-gray-200 p-4 mt-4">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Split Details</h3>
                  <div className="space-y-2">
                    {members.map(m => (
                      <div key={m.user.id} className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">{m.user.name}</span>
                        <input 
                          type="checkbox" 
                          checked={expSelectedMembers.includes(m.user.id)}
                          onChange={() => toggleMemberSelection(m.user.id)}
                          className="w-4 h-4 text-[#4f46e5] border-gray-300 rounded focus:ring-[#4f46e5]" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-8">
                <button onClick={() => setShowExpenseModal(false)} className="bg-white border border-gray-900 text-gray-900 px-6 py-2.5 font-bold text-xs uppercase tracking-wider hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddExpense} className="bg-[#4f46e5] text-white px-6 py-2.5 font-bold text-xs uppercase tracking-wider hover:bg-[#4338ca]">Save Expense</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
