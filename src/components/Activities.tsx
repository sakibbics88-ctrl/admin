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
import { Activity, ActivityType, UserProfile } from '../types';
import { 
  Plus, 
  FileText, 
  Users, 
  Calendar, 
  MessageSquare, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  X,
  Search,
  BookOpen
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface ActivitiesProps {
  user: UserProfile | null;
}

export default function Activities({ user }: ActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<Activity>>({
    type: 'Dawati',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    participants: 0,
    notes: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'activities'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin') return;

    try {
      if (editingActivity) {
        await updateDoc(doc(db, 'activities', editingActivity.id!), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'activities'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingActivity(null);
      setFormData({
        type: 'Dawati',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        participants: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (user?.role !== 'admin' || !window.confirm('আপনি কি নিশ্চিত যে আপনি এই কার্যক্রমটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'activities', id));
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const filteredActivities = activities.filter(activity => {
    return typeFilter === 'All' || activity.type === typeFilter;
  });

  const typeLabels: Record<ActivityType, string> = {
    'Dawati': 'দাওয়াতি কাজ',
    'Event': 'ইভেন্ট',
    'Meeting': 'মিটিং',
    'Note': 'নোট'
  };

  const typeIcons: Record<ActivityType, any> = {
    'Dawati': BookOpen,
    'Event': Calendar,
    'Meeting': Users,
    'Note': MessageSquare
  };

  const typeColors: Record<ActivityType, string> = {
    'Dawati': 'bg-blue-100 text-blue-600',
    'Event': 'bg-purple-100 text-purple-600',
    'Meeting': 'bg-green-100 text-green-600',
    'Note': 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">কার্যক্রম ও রিপোর্ট</h1>
          <p className="text-gray-500">সংগঠনের সকল কার্যক্রমের রেকর্ড ও রিপোর্ট</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              setEditingActivity(null);
              setFormData({
                type: 'Dawati',
                title: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                participants: 0,
                notes: ''
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-green-100"
          >
            <Plus className="w-5 h-5" />
            নতুন কার্যক্রম যোগ করুন
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setTypeFilter('All')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
            typeFilter === 'All' ? "bg-green-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
          )}
        >
          সবগুলো
        </button>
        {Object.entries(typeLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              typeFilter === key ? "bg-green-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Activities Timeline */}
      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
        {filteredActivities.map((activity, index) => {
          const Icon = typeIcons[activity.type];
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
            >
              {/* Dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white shadow-md z-10 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <Icon className={cn("w-5 h-5", typeColors[activity.type].split(' ')[1])} />
              </div>

              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <time className="text-xs font-bold text-green-600">{formatDate(activity.date)}</time>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {user?.role === 'admin' && (
                      <>
                        <button 
                          onClick={() => {
                            setEditingActivity(activity);
                            setFormData(activity);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(activity.id!)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", typeColors[activity.type])}>
                    {typeLabels[activity.type]}
                  </span>
                  <h3 className="font-bold text-gray-900">{activity.title}</h3>
                </div>
                <div className="text-sm text-gray-600 mb-4 prose prose-sm max-w-none">
                  <ReactMarkdown>{activity.description || ''}</ReactMarkdown>
                </div>
                {activity.participants && activity.participants > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
                    <Users className="w-3.5 h-3.5" />
                    <span>অংশগ্রহণকারী: {activity.participants} জন</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {filteredActivities.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500">কোনো কার্যক্রম পাওয়া যায়নি</p>
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-green-600 text-white">
                <h2 className="text-xl font-bold">
                  {editingActivity ? 'কার্যক্রম তথ্য পরিবর্তন' : 'নতুন কার্যক্রম যোগ করুন'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">ধরণ</label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as ActivityType})}
                    >
                      {Object.entries(typeLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">তারিখ</label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-bold text-gray-700">শিরোনাম</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-bold text-gray-700">বর্ণনা (Markdown সমর্থিত)</label>
                    <textarea
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none resize-none h-32"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">অংশগ্রহণকারী সংখ্যা</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.participants}
                      onChange={(e) => setFormData({...formData, participants: parseInt(e.target.value)})}
                    />
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
                    {editingActivity ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
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
