
import type { User } from "@supabase/supabase-js";

export type Profile = {
    id: string;
    full_name: string;
    avatar_url: string;
    is_verified: boolean;
    phone?: string;
    nin_image_url?: string;
    selfie_image_url?: string;
    verification_payment_status?: 'unpaid' | 'paid';
    role?: string; // Add role to profile type
};

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string[];
  category: Category;
  location: string;
  city: string;
  condition: Condition;
  description: string;
  postedDate: string; // ISO 8601 date string
  'data-ai-hint'?: string;
  deliveryFee?: number;
  user_id: string;
  seller?: Profile;
};

export type ProductWithSeller = Product & {
  seller: {
    id: string;
    full_name: string;
    avatar_url?: string;
    is_verified: boolean;
  }
}

export type HeroImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
};

export const categories = ['Cars', 'Electronics', 'Real Estate', 'Furniture', 'Phones'] as const;
export type Category = (typeof categories)[number];


export const conditions = ['New', 'Used', 'Refurbished'] as const;
export type Condition = (typeof conditions)[number];

export const datePostedOptions = ['any', 'today', 'last7days', 'last30days'] as const;
export type DatePostedOption = typeof datePostedOptions[number];

export const orderStatuses = ['Processing', 'Shipped', 'Completed', 'Canceled', 'Disputed'] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export type Order = {
  id: string;
  created_at: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  subtotal: number;
  shipping_fee: number;
  escrow_fee: number;
  total_amount: number;
  status: OrderStatus;
};

export type OrderItem = {
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    price: number; // Price at the time of purchase
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type ReviewWithUser = Review & {
  user: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};
