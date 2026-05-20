export interface Friend {
  id: string | number;
  name: string;
  avatarBg: string;
  phone?: string;
  email?: string;
}

export interface BillItem {
  name: string;
  price: string | number;
  quantity: string | number;
  totalPrice: string | number;
  assignments: Record<string | number, number>;
}

export interface OtherFee {
  name: string;
  amount: string | number;
}

export interface Bill {
  title: string;
  date: string;
  category: string;
  items: BillItem[];
  taxType: 'percent' | 'manual';
  taxPercent: string | number;
  taxManual: string | number;
  discountType: 'percent' | 'manual';
  discountPercent: string | number;
  discountManual: string | number;
  otherFees: OtherFee[];
}

export interface HistoryRecord {
  id: number;
  title: string;
  date: string;
  peopleCount: number;
  amount: number;
  iconType: string;
  iconBg: string;
  items: BillItem[];
  invitedFriends: Friend[];
  taxType: 'percent' | 'manual';
  taxPercent: number;
  taxManual: number;
  taxAmount: number;
  discountType: 'percent' | 'manual';
  discountPercent: number;
  discountManual: number;
  discountAmount: number;
  otherFees: { name: string; amount: number }[];
  subtotalItems: number;
  subtotalOtherFees: number;
  shares?: {
    friendId: string | number;
    name: string;
    amount: number;
  }[];
}

export interface LanguageDictionary {
  [key: string]: string;
}

export interface CekaSettings {
  currency: string;
  language: 'id' | 'en';
  theme: 'light' | 'dark';
}
