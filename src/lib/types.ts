export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: Category;
  location: string;
  condition: Condition;
  description: string;
  'data-ai-hint'?: string;
};

export const categories = ['Cars', 'Electronics', 'Real Estate', 'Furniture', 'Phones'] as const;
export type Category = (typeof categories)[number];


export const conditions = ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'] as const;
export type Condition = (typeof conditions)[number];

export const locations: string[] = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano'];
