import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { 
  Shield, 
  User, 
  Mail, 
  Calendar, 
  Check, 
  X,
  AlertTriangle
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion } from 'motion/react';

interface AdminProps {
  user: UserProfile | null;
}

export default function Admin({ user }: AdminProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (user?.role !== 'admin') return;
    if (uid === user.uid) {
      alert('আপনি নিজের রোল পরিবর্তন করতে পারবেন না।');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="bg-red-100 p-4 rounded-full text-red-600 mb-4">
          <Shield className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">অ্যাক্সেস নেই</h2>
        <p className="text-gray-600">এই পৃষ্ঠাটি শুধুমাত্র অ্যাডমিনদের জন্য।</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">অ্যাডমিন প্যানেল</h1>
        <p className="text-gray-500">ব্যবহারকারী ব্যবস্থাপনা ও রোল নির্ধারণ</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-medium">সতর্কতা: রোল পরিবর্তনের সময় সাবধানে কাজ করুন।</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">ব্যবহারকারী</th>
                <th className="px-6 py-4">ইমেইল</th>
                <th className="px-6 py-4">রোল</th>
                <th className="px-6 py-4">যোগদান</th>
                <th className="px-6 py-4">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                        {u.displayName?.[0] || 'U'}
                      </div>
                      <span className="text-sm font-bold">{u.displayName || 'অজানা'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-xs font-bold px-3 py-1 rounded-full",
                      u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {u.role === 'admin' ? 'অ্যাডমিন' : 'ভিউয়ার'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {u.createdAt ? formatDate(u.createdAt) : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {u.uid !== user.uid && (
                      <select
                        className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-green-500"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                      >
                        <option value="viewer">ভিউয়ার করুন</option>
                        <option value="admin">অ্যাডমিন করুন</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
