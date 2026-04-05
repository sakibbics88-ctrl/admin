import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Filter,
  Wallet,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Member, Income, Expense, Plan } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member)));
    });

    const unsubIncome = onSnapshot(collection(db, 'income'), (snapshot) => {
      setIncome(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Income)));
    });

    const unsubExpenses = onSnapshot(collection(db, 'expense'), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });

    const unsubPlans = onSnapshot(query(collection(db, 'plans'), orderBy('deadline', 'asc'), limit(5)), (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan)));
    });

    setLoading(false);
    return () => {
      unsubMembers();
      unsubIncome();
      unsubExpenses();
      unsubPlans();
    };
  }, []);

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpenses;

  const activeMembers = members.filter(m => m.status === 'active').length;
  const pendingPlans = plans.filter(p => p.status === 'pending').length;

  const chartData = [
    { name: 'জানুয়ারি', আয়: 4000, ব্যয়: 2400 },
    { name: 'ফেব্রুয়ারি', আয়: 3000, ব্যয়: 1398 },
    { name: 'মার্চ', আয়: 2000, ব্যয়: 9800 },
    { name: 'এপ্রিল', আয়: 2780, ব্যয়: 3908 },
    { name: 'মে', আয়: 1890, ব্যয়: 4800 },
    { name: 'জুন', আয়: 2390, ব্যয়: 3800 },
  ];

  const memberStats = [
    { name: 'সদস্য', value: members.filter(m => m.category === 'Member').length, color: '#16a34a' },
    { name: 'সাথী', value: members.filter(m => m.category === 'Associate').length, color: '#22c55e' },
    { name: 'কর্মী', value: members.filter(m => m.category === 'Worker').length, color: '#4ade80' },
    { name: 'সমর্থক', value: members.filter(m => m.category === 'Supporter').length, color: '#86efac' },
  ];

  const stats = [
    { title: 'মোট সদস্য', value: members.length, icon: Users, color: 'bg-blue-500', trend: '+12%', positive: true },
    { title: 'মোট আয়', value: formatCurrency(totalIncome), icon: TrendingUp, color: 'bg-green-500', trend: '+5%', positive: true },
    { title: 'মোট ব্যয়', value: formatCurrency(totalExpenses), icon: TrendingDown, color: 'bg-red-500', trend: '-2%', positive: false },
    { title: 'বর্তমান ব্যালেন্স', value: formatCurrency(balance), icon: Wallet, color: 'bg-purple-500', trend: '+8%', positive: true },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className={cn("p-3 rounded-xl text-white", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn("flex items-center gap-1 text-sm font-medium", stat.positive ? "text-green-600" : "text-red-600")}>
                {stat.trend}
                {stat.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold">আর্থিক সারাংশ</h3>
              <p className="text-sm text-gray-500">মাসিক আয় ও ব্যয়ের তুলনা</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              ফিল্টার
            </button>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="আয়" stroke="#16a34a" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="ব্যয়" stroke="#dc2626" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6">সদস্য বিন্যাস</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memberStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {memberStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {memberStats.map((stat) => (
              <div key={stat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: stat.color}}></div>
                  <span className="text-gray-600">{stat.name}</span>
                </div>
                <span className="font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Plans */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">আসন্ন পরিকল্পনা</h3>
            <Link to="/planning" className="text-sm text-green-600 font-medium hover:underline">সব দেখুন</Link>
          </div>
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    plan.status === 'completed' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                  )}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{plan.title}</h4>
                    <p className="text-xs text-gray-500">ডেডলাইন: {formatDate(plan.deadline)}</p>
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full",
                  plan.status === 'completed' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                )}>
                  {plan.status === 'completed' ? 'সম্পন্ন' : 'চলমান'}
                </span>
              </div>
            ))}
            {plans.length === 0 && <p className="text-center text-gray-500 py-4">কোনো পরিকল্পনা নেই</p>}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">সাম্প্রতিক কার্যক্রম</h3>
            <Link to="/activities" className="text-sm text-green-600 font-medium hover:underline">সব দেখুন</Link>
          </div>
          <div className="space-y-4">
            {/* Placeholder for activities */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-gray-200">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">দাওয়াতি সভা - মার্চ ২০২৪</h4>
                <p className="text-xs text-gray-500">তারিখ: ১২ মার্চ, ২০২৪</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

