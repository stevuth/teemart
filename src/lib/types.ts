export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'Cars' | 'Electronics' | 'Real Estate' | 'Furniture' | 'Phones';
  location: string;
  condition: 'New' | 'Used - Like New' | 'Used - Good' | 'Used - Fair';
  description: string;
};

export type Category = Product['category'];

export const categories: Category[] = ['Cars', 'Electronics', 'Real Estate', 'Furniture', 'Phones'];

export const conditions: Product['condition'][] = ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'];

export const locations: string[] = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano'];
