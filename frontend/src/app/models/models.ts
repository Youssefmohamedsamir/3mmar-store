export interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  provider: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  provider: string;
  avatarUrl?: string;
}

export interface Product {
  id: number;
  name: string;
  category: 'IPhone' | 'Android' | 'Accessories' | 'Other' | string;
  description: string;
  price: number;
  oldPrice?: number;
  quantity?: number;
  imageUrl: string;
  images?: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface Offer {
  id: number;
  title: string;
  description: string;
  badgeText: string;
  imageUrl?: string;
  actionUrl?: string;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: string;
  phone: string;
  whatsApp: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  welcomeMessage: string;
  address: string;
}

export interface AnalyticsSummary {
  totalVisitors: number;
  totalRegisteredUsers: number;
  totalProducts: number;
  totalOrderClicks: number;
  whatsAppClicks: number;
  phoneCallClicks: number;
  recentIntents: {
    id: number;
    productName: string;
    category: string;
    price: number;
    orderType: string;
    customerName: string;
    customerEmail: string;
    createdAt: string;
  }[];
  recentUsers: {
    id: number;
    fullName: string;
    email: string;
    provider: string;
    role: string;
    createdAt: string;
  }[];
}
