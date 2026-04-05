import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Income, Expense, UserProfile, IncomeCategory, ExpenseCategory } from '../types';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Tag,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import ReportGenerator from './ReportGenerator';

interface FinanceProps {
  user: UserProfile | null;
}

export default function Finance({ user }: FinanceProps) {
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expense' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [reportMonth, setReportMonth] = useState<string>(new Date().toLocaleString('bn-BD', { month: 'long' }));
  const [reportYear, setReportYear] = useState<string>(new Date().getFullYear().toString());

  const [incomeFormData, setIncomeFormData] = useState<Partial<Income>>({
    donorName: '',
    amount: 0,
    month: new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' }),
    date: new Date().toISOString().split('T')[0],
    category: 'donation',
    notes: ''
  });

  const [expenseFormData, setExpenseFormData] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'others',
    approvedBy: '',
    notes: ''
  });

  useEffect(() => {
    const unsubIncome = onSnapshot(query(collection(db, 'income'), orderBy('date', 'desc')), (snapshot) => {
      setIncome(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Income)));
    });

    const unsubExpenses = onSnapshot(query(collection(db, 'expense'), orderBy('date', 'desc')), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });

    setLoading(false);
    return () => {
      unsubIncome();
      unsubExpenses();
    };
  }, []);

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin') return;

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'income', editingItem.id), {
          ...incomeFormData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'income'), {
          ...incomeFormData,
          createdAt: new Date().toISOString()
        });
      }
      setIsIncomeModalOpen(false);
      setEditingItem(null);
      setIncomeFormData({
        donorName: '',
        amount: 0,
        month: new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' }),
        date: new Date().toISOString().split('T')[0],
        category: 'donation',
        notes: ''
      });
    } catch (error) {
      console.error('Error saving income:', error);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin') return;

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'expense', editingItem.id), {
          ...expenseFormData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'expense'), {
          ...expenseFormData,
          createdAt: new Date().toISOString()
        });
      }
      setIsExpenseModalOpen(false);
      setEditingItem(null);
      setExpenseFormData({
        title: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: 'others',
        approvedBy: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleDelete = async (id: string, type: 'income' | 'expense') => {
    if (user?.role !== 'admin' || !window.confirm('আপনি কি নিশ্চিত যে আপনি এই রেকর্ডটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, type, id));
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpenses;

  const incomeCategories: IncomeCategory[] = ['donation', 'subscription', 'special fund'];
  const expenseCategories: ExpenseCategory[] = ['event', 'transport', 'printing', 'others'];

  const categoryLabels: Record<string, string> = {
    'donation': 'সুধী অনুদান',
    'subscription': 'মাসিক চাঁদা',
    'special fund': 'বিশেষ তহবিল',
    'event': 'ইভেন্ট',
    'transport': 'যাতায়াত',
    'printing': 'প্রিন্টিং',
    'others': 'অন্যান্য'
  };

  const chartData = [
    { name: 'আয়', value: totalIncome, color: '#16a34a' },
    { name: 'ব্যয়', value: totalExpenses, color: '#dc2626' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">আর্থিক ব্যবস্থাপনা</h1>
          <p className="text-gray-500">সংগঠনের আয় ও ব্যয়ের হিসাব</p>
        </div>
        {user?.role === 'admin' && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditingItem(null);
                setIsIncomeModalOpen(true);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-green-100"
            >
              <Plus className="w-5 h-5" />
              আয় যোগ করুন
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setIsExpenseModalOpen(true);
              }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-red-100"
            >
              <Plus className="w-5 h-5" />
              ব্যয় যোগ করুন
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-xl text-green-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">মোট আয়</p>
              <h3 className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-xl text-red-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">মোট ব্যয়</p>
              <h3 className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">বর্তমান ব্যালেন্স</p>
              <h3 className="text-2xl font-bold text-purple-600">{formatCurrency(balance)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-6 py-4 text-sm font-bold transition-all",
              activeTab === 'overview' ? "text-green-600 border-b-2 border-green-600 bg-green-50/30" : "text-gray-500 hover:text-gray-700"
            )}
          >
            সারসংক্ষেপ
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={cn(
              "px-6 py-4 text-sm font-bold transition-all",
              activeTab === 'income' ? "text-green-600 border-b-2 border-green-600 bg-green-50/30" : "text-gray-500 hover:text-gray-700"
            )}
          >
            আয়ের তালিকা
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={cn(
              "px-6 py-4 text-sm font-bold transition-all",
              activeTab === 'expense' ? "text-green-600 border-b-2 border-green-600 bg-green-50/30" : "text-gray-500 hover:text-gray-700"
            )}
          >
            ব্যয়ের তালিকা
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={cn(
              "px-6 py-4 text-sm font-bold transition-all",
              activeTab === 'reports' ? "text-green-600 border-b-2 border-green-600 bg-green-50/30" : "text-gray-500 hover:text-gray-700"
            )}
          >
            রিপোর্ট জেনারেটর
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-[300px]">
                <h4 className="text-sm font-bold text-gray-700 mb-4">আয় বনাম ব্যয়</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-700 mb-4">সাম্প্রতিক লেনদেন</h4>
                <div className="space-y-3">
                  {[...income, ...expenses]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            'donorName' in item ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          )}>
                            {'donorName' in item ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{'donorName' in item ? item.donorName : item.title}</p>
                            <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "text-sm font-bold",
                          'donorName' in item ? "text-green-600" : "text-red-600"
                        )}>
                          {'donorName' in item ? '+' : '-'}{formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'income' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-4 py-3">দাতা/সুধী</th>
                    <th className="px-4 py-3">পরিমাণ</th>
                    <th className="px-4 py-3">ধরণ</th>
                    <th className="px-4 py-3">তারিখ</th>
                    <th className="px-4 py-3">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {income.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold">{item.donorName}</p>
                        <p className="text-xs text-gray-500">{item.month}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-green-600">{formatCurrency(item.amount)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                          {categoryLabels[item.category]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{formatDate(item.date)}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingItem(item);
                              setIncomeFormData(item);
                              setIsIncomeModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id!, 'income')}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'expense' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-4 py-3">শিরোনাম</th>
                    <th className="px-4 py-3">পরিমাণ</th>
                    <th className="px-4 py-3">ধরণ</th>
                    <th className="px-4 py-3">তারিখ</th>
                    <th className="px-4 py-3">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold">{item.title}</p>
                        <p className="text-xs text-gray-500">অনুমোদনে: {item.approvedBy}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-red-600">{formatCurrency(item.amount)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full font-medium">
                          {categoryLabels[item.category]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{formatDate(item.date)}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingItem(item);
                              setExpenseFormData(item);
                              setIsExpenseModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id!, 'expense')}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">মাস নির্বাচন করুন</label>
                  <select
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                  >
                    {['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">বছর নির্বাচন করুন</label>
                  <select
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                    value={reportYear}
                    onChange={(e) => setReportYear(e.target.value)}
                  >
                    {[2023, 2024, 2025, 2026].map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center">
                <ReportGenerator 
                  income={income.filter(i => i.month.includes(reportMonth) && i.month.includes(reportYear))}
                  expenses={expenses.filter(e => {
                    const date = new Date(e.date);
                    const monthName = date.toLocaleString('bn-BD', { month: 'long' });
                    const yearName = date.getFullYear().toString();
                    return monthName === reportMonth && yearName === reportYear;
                  })}
                  month={reportMonth}
                  year={reportYear}
                />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-lg font-bold mb-4">রিপোর্ট প্রিভিউ ({reportMonth} {reportYear})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="font-bold text-green-600 border-b pb-2">আয়ের বিবরণ</h5>
                    {income.filter(i => i.month.includes(reportMonth) && i.month.includes(reportYear)).length > 0 ? (
                      income.filter(i => i.month.includes(reportMonth) && i.month.includes(reportYear)).map(i => (
                        <div key={i.id} className="flex justify-between text-sm">
                          <span>{i.donorName}</span>
                          <span className="font-bold">{formatCurrency(i.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">কোনো আয়ের রেকর্ড নেই</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    <h5 className="font-bold text-red-600 border-b pb-2">ব্যয়ের বিবরণ</h5>
                    {expenses.filter(e => {
                      const date = new Date(e.date);
                      const monthName = date.toLocaleString('bn-BD', { month: 'long' });
                      const yearName = date.getFullYear().toString();
                      return monthName === reportMonth && yearName === reportYear;
                    }).length > 0 ? (
                      expenses.filter(e => {
                        const date = new Date(e.date);
                        const monthName = date.toLocaleString('bn-BD', { month: 'long' });
                        const yearName = date.getFullYear().toString();
                        return monthName === reportMonth && yearName === reportYear;
                      }).map(e => (
                        <div key={e.id} className="flex justify-between text-sm">
                          <span>{e.title}</span>
                          <span className="font-bold">{formatCurrency(e.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">কোনো ব্যয়ের রেকর্ড নেই</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Income Modal */}
      <AnimatePresence>
        {isIncomeModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsIncomeModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-green-600 text-white">
                <h2 className="text-xl font-bold">
                  {editingItem ? 'আয়ের তথ্য পরিবর্তন' : 'নতুন আয় যোগ করুন'}
                </h2>
                <button onClick={() => setIsIncomeModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleIncomeSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">দাতা/সুধী ব্যক্তির নাম</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                    value={incomeFormData.donorName}
                    onChange={(e) => setIncomeFormData({...incomeFormData, donorName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">পরিমাণ (টাকা)</label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                      value={incomeFormData.amount}
                      onChange={(e) => setIncomeFormData({...incomeFormData, amount: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">ধরণ</label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                      value={incomeFormData.category}
                      onChange={(e) => setIncomeFormData({...incomeFormData, category: e.target.value as IncomeCategory})}
                    >
                      {incomeCategories.map(cat => (
                        <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">তারিখ</label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                      value={incomeFormData.date}
                      onChange={(e) => setIncomeFormData({...incomeFormData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">মাস</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                      value={incomeFormData.month}
                      onChange={(e) => setIncomeFormData({...incomeFormData, month: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">নোট</label>
                  <textarea
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none resize-none h-20"
                    value={incomeFormData.notes}
                    onChange={(e) => setIncomeFormData({...incomeFormData, notes: e.target.value})}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsIncomeModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
                  >
                    {editingItem ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expense Modal */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-red-600 text-white">
                <h2 className="text-xl font-bold">
                  {editingItem ? 'ব্যয়ের তথ্য পরিবর্তন' : 'নতুন ব্যয় যোগ করুন'}
                </h2>
                <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">ব্যয়ের শিরোনাম</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none"
                    value={expenseFormData.title}
                    onChange={(e) => setExpenseFormData({...expenseFormData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">পরিমাণ (টাকা)</label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none"
                      value={expenseFormData.amount}
                      onChange={(e) => setExpenseFormData({...expenseFormData, amount: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">ধরণ</label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none"
                      value={expenseFormData.category}
                      onChange={(e) => setExpenseFormData({...expenseFormData, category: e.target.value as ExpenseCategory})}
                    >
                      {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">তারিখ</label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none"
                      value={expenseFormData.date}
                      onChange={(e) => setExpenseFormData({...expenseFormData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">অনুমোদনে</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none"
                      value={expenseFormData.approvedBy}
                      onChange={(e) => setExpenseFormData({...expenseFormData, approvedBy: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">নোট</label>
                  <textarea
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none resize-none h-20"
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData({...expenseFormData, notes: e.target.value})}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                  >
                    {editingItem ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
