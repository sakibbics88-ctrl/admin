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
import { Plan, PlanStatus, UserProfile } from '../types';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  X,
  User,
  Filter
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface PlanningProps {
  user: UserProfile | null;
}

export default function Planning({ user }: PlanningProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<Plan>>({
    title: '',
    description: '',
    deadline: new Date().toISOString().split('T')[0],
    status: 'pending',
    assignedTo: '',
    month: new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' })
  });

  useEffect(() => {
    const q = query(collection(db, 'plans'), orderBy('deadline', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin') return;

    try {
      if (editingPlan) {
        await updateDoc(doc(db, 'plans', editingPlan.id!), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'plans'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingPlan(null);
      setFormData({
        title: '',
        description: '',
        deadline: new Date().toISOString().split('T')[0],
        status: 'pending',
        assignedTo: '',
        month: new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' })
      });
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (user?.role !== 'admin' || !window.confirm('আপনি কি নিশ্চিত যে আপনি এই পরিকল্পনাটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'plans', id));
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: PlanStatus) => {
    if (user?.role !== 'admin') return;
    try {
      await updateDoc(doc(db, 'plans', id), { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredPlans = plans.filter(plan => {
    return statusFilter === 'All' || plan.status === statusFilter;
  });

  const statusLabels: Record<PlanStatus, string> = {
    'pending': 'অপেক্ষমান',
    'ongoing': 'চলমান',
    'completed': 'সম্পন্ন'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">মাসিক পরিকল্পনা</h1>
          <p className="text-gray-500">সংগঠনের লক্ষ্য ও কাজসমূহ নির্ধারণ করুন</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              setEditingPlan(null);
              setFormData({
                title: '',
                description: '',
                deadline: new Date().toISOString().split('T')[0],
                status: 'pending',
                assignedTo: '',
                month: new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' })
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-green-100"
          >
            <Plus className="w-5 h-5" />
            নতুন পরিকল্পনা যোগ করুন
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter('All')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
            statusFilter === 'All' ? "bg-green-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
          )}
        >
          সবগুলো
        </button>
        {Object.entries(statusLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              statusFilter === key ? "bg-green-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredPlans.map((plan) => (
            <motion.div
              key={plan.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{plan.title}</h3>
                    <span className={cn(
                      "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                      plan.status === 'completed' ? "bg-green-100 text-green-700" :
                      plan.status === 'ongoing' ? "bg-blue-100 text-blue-700" :
                      "bg-orange-100 text-orange-700"
                    )}>
                      {statusLabels[plan.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{plan.description || 'কোনো বর্ণনা নেই'}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>ডেডলাইন: {formatDate(plan.deadline)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      <span>দায়িত্বে: {plan.assignedTo || 'নির্ধারিত নয়'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>মাস: {plan.month}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user?.role === 'admin' && (
                    <>
                      {plan.status !== 'completed' && (
                        <button
                          onClick={() => handleStatusChange(plan.id!, 'completed')}
                          className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                          title="সম্পন্ন হিসেবে চিহ্নিত করুন"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setFormData(plan);
                          setIsModalOpen(true);
                        }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id!)}
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredPlans.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">কোনো পরিকল্পনা পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
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
                  {editingPlan ? 'পরিকল্পনা পরিবর্তন' : 'নতুন পরিকল্পনা যোগ করুন'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">শিরোনাম</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">বর্ণনা</label>
                  <textarea
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none resize-none h-24"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">ডেডলাইন</label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.deadline}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">দায়িত্বে</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">মাস</label>
                    <input
                      type="text"
                      placeholder="মার্চ ২০২৪"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.month}
                      onChange={(e) => setFormData({...formData, month: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">অবস্থা</label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as PlanStatus})}
                    >
                      <option value="pending">অপেক্ষমান</option>
                      <option value="ongoing">চলমান</option>
                      <option value="completed">সম্পন্ন</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
                  >
                    {editingPlan ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
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
