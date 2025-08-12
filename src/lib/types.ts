
import type { User } from "@supabase/supabase-js";

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
  user_id?: string;
};

export type ProductWithSeller = Product & {
  seller: {
    id: string;
    full_name: string;
    avatar_url?: string;
  }
}

export const categories = ['Cars', 'Electronics', 'Real Estate', 'Furniture', 'Phones'] as const;
export type Category = (typeof categories)[number];


export const conditions = ['New', 'Used', 'Refurbished'] as const;
export type Condition = (typeof conditions)[number];

export const datePostedOptions = ['any', 'today', 'last7days', 'last30days'] as const;
export type DatePostedOption = typeof datePostedOptions[number];

export const orderStatuses = ['Processing', 'Completed', 'Canceled'] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export type Order = {
  id: string;
  productId: string;
  buyerName: string;
  orderDate: string; // ISO 8601 date string
  status: OrderStatus;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

// For fetching reviews with user data
export type ReviewWithUser = Review & {
  user: {
    user_metadata: {
      full_name: string;
      avatar_url?: string;
    }
  } | null;
};
