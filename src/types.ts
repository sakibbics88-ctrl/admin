export type UserRole = 'admin' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt?: string;
}

export type MemberCategory = 'Supporter' | 'Worker' | 'Associate' | 'Member';

export interface Member {
  id?: string;
  name: string;
  phone?: string;
  address?: string;
  category: MemberCategory;
  joinDate?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
}

export type PlanStatus = 'pending' | 'ongoing' | 'completed';

export interface Plan {
  id?: string;
  title: string;
  description?: string;
  deadline: string;
  status: PlanStatus;
  assignedTo?: string;
  month: string;
  createdAt?: string;
}

export type ActivityType = 'Dawati' | 'Event' | 'Meeting' | 'Note';

export interface Activity {
  id?: string;
  type: ActivityType;
  title: string;
  description?: string;
  date: string;
  participants?: number;
  notes?: string;
  createdAt?: string;
}

export type IncomeCategory = 'donation' | 'subscription' | 'special fund';

export interface Income {
  id?: string;
  donorName: string;
  amount: number;
  month: string;
  date: string;
  category: IncomeCategory;
  notes?: string;
  createdAt?: string;
}

export type ExpenseCategory = 'event' | 'transport' | 'printing' | 'others';

export interface Expense {
  id?: string;
  title: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  approvedBy?: string;
  notes?: string;
  createdAt?: string;
}
