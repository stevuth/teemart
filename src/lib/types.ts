
export type Product = {
  id: string;
  name: string;
  price: number;
  image: string[] | string; // Allow for array of images or a single one for existing data
  category: Category;
  location: string;
  condition: Condition;
  description: string;
  postedDate: string; // ISO 8601 date string
  'data-ai-hint'?: string;
  deliveryFee?: number;
};

export const categories = ['Cars', 'Electronics', 'Real Estate', 'Furniture', 'Phones'] as const;
export type Category = (typeof categories)[number];


export const conditions = ['New', 'Used', 'Refurbished'] as const;
export type Condition = (typeof conditions)[number];

export const locations: string[] = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
    'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
    'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe',
    'Zamfara', 'FCT - Abuja'
];

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
