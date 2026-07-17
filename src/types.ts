export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  status: "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";
  source: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  customer: string;
  amount: number;
  product: string;
  date: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  completed: boolean;
}

export interface CompanyProfile {
  name: string;
  industry: string;
  email: string;
  phone: string;
  address: string;
  website: string;
}

export interface DashboardStats {
  totalCustomers: number;
  activeLeads: number;
  salesRevenue: number;
  pendingTasks: number;
}
