import type { Product } from './types';
import { subDays } from 'date-fns';

const now = new Date();

export const products: Product[] = [
  {
    id: '1',
    name: '2018 Toyota Corolla',
    price: 6800000,
    image: 'https://picsum.photos/600/400?random=1',
    category: 'Cars',
    location: 'Lagos',
    condition: 'Used',
    description: 'A clean, well-maintained 2018 Toyota Corolla with automatic transmission and excellent fuel economy.',
    postedDate: subDays(now, 2).toISOString(),
    "data-ai-hint": 'sedan car'
  },
  {
    id: '2',
    name: 'Apple iPhone 12 Pro',
    price: 350000,
    image: 'https://picsum.photos/600/400?random=2',
    category: 'Phones',
    location: 'Abuja',
    condition: 'Used',
    description: '128GB iPhone 12 Pro in Pacific Blue. No scratches, perfect working condition, with original box.',
    postedDate: now.toISOString(),
    "data-ai-hint": 'smartphone iphone'
  },
  {
    id: '3',
    name: '3-Bedroom Apartment in Lekki',
    price: 85000000,
    image: 'https://picsum.photos/600/400?random=3',
    category: 'Real Estate',
    location: 'Lagos',
    condition: 'Used',
    description: 'Spacious 3-bedroom apartment with modern finishing in a serene and secure estate in Lekki Phase 1.',
    postedDate: subDays(now, 10).toISOString(),
    "data-ai-hint": 'modern apartment'
  },
  {
    id: '4',
    name: 'L-Shaped Sofa Set',
    price: 280000,
    image: 'https://picsum.photos/600/400?random=4',
    category: 'Furniture',
    location: 'Port Harcourt',
    condition: 'Used',
    description: 'Comfortable 6-seater L-shaped sofa. Grey fabric, comes with four throw pillows. Less than 2 years old.',
    postedDate: subDays(now, 5).toISOString(),
    "data-ai-hint": 'living room'
  },
  {
    id: '5',
    name: 'Samsung 55" 4K Smart TV',
    price: 220000,
    image: 'https://picsum.photos/600/400?random=5',
    category: 'Electronics',
    location: 'Ibadan',
    condition: 'Refurbished',
    description: 'Experience stunning 4K visuals with this Samsung smart TV. All apps working perfectly. Comes with remote.',
    postedDate: subDays(now, 40).toISOString(),
    "data-ai-hint": 'television livingroom'
  },
  {
    id: '6',
    name: '2016 Honda Accord',
    price: 5500000,
    image: 'https://picsum.photos/600/400?random=6',
    category: 'Cars',
    location: 'Abuja',
    condition: 'Used',
    description: 'Foreign used Honda Accord, accident-free, with leather seats and reverse camera.',
    postedDate: subDays(now, 1).toISOString(),
    "data-ai-hint": 'family car'
  },
  {
    id: '7',
    name: '4-Bedroom Duplex in Maitama',
    price: 150000000,
    image: 'https://picsum.photos/600/400?random=7',
    category: 'Real Estate',
    location: 'Abuja',
    condition: 'New',
    description: 'Luxurious 4-bedroom semi-detached duplex in a prime Maitama location. Features a BQ and ample parking space.',
    postedDate: subDays(now, 60).toISOString(),
    "data-ai-hint": 'luxury house'
  },
  {
    id: '8',
    name: 'Samsung Galaxy S21 Ultra',
    price: 320000,
    image: 'https://picsum.photos/600/400?random=8',
    category: 'Phones',
    location: 'Lagos',
    condition: 'Used',
    description: 'Phantom Black Galaxy S21 Ultra, 256GB. Minor signs of use but works perfectly. Great camera quality.',
    postedDate: subDays(now, 8).toISOString(),
    "data-ai-hint": 'android smartphone'
  },
  {
    id: '9',
    name: 'HP Spectre x360 Laptop',
    price: 450000,
    image: 'https://picsum.photos/600/400?random=9',
    category: 'Electronics',
    location: 'Kano',
    condition: 'Used',
    description: '13-inch HP Spectre x360, Core i7, 16GB RAM, 512GB SSD. Convertible and touchscreen. Ideal for professionals.',
    postedDate: subDays(now, 25).toISOString(),
    "data-ai-hint": 'laptop workspace'
  },
  {
    id: '10',
    name: '6-Seater Dining Table Set',
    price: 180000,
    image: 'https://picsum.photos/600/400?random=10',
    category: 'Furniture',
    location: 'Lagos',
    condition: 'Used',
    description: 'Wooden dining table with 6 matching chairs. Shows some signs of wear but is sturdy and functional.',
    postedDate: subDays(now, 3).toISOString(),
    "data-ai-hint": 'dining room'
  },
  {
    id: '11',
    name: 'Canon EOS 80D DSLR Camera',
    price: 300000,
    image: 'https://picsum.photos/600/400?random=11',
    category: 'Electronics',
    location: 'Ibadan',
    condition: 'Used',
    description: 'Canon 80D camera body with 18-55mm kit lens. Perfect for enthusiast photographers and videographers.',
    postedDate: subDays(now, 15).toISOString(),
    "data-ai-hint": 'camera gear'
  },
  {
    id: '12',
    name: '2019 Lexus RX 350',
    price: 22000000,
    image: 'https://picsum.photos/600/400?random=12',
    category: 'Cars',
    location: 'Port Harcourt',
    condition: 'Used',
    description: 'Tokunbo Lexus RX 350, pristine condition. Fully loaded with panoramic roof and Mark Levinson sound system.',
    postedDate: subDays(now, 90).toISOString(),
    "data-ai-hint": 'luxury suv'
  }
];
