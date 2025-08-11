
import type { Order } from './types';
import { subDays } from 'date-fns';

const now = new Date();

export const orders: Order[] = [
    {
        id: 'ord-1',
        productId: '2',
        buyerName: 'Bola Ahmed',
        orderDate: subDays(now, 1).toISOString(),
        status: 'Processing',
    },
    {
        id: 'ord-2',
        productId: '4',
        buyerName: 'Aisha Buhari',
        orderDate: subDays(now, 3).toISOString(),
        status: 'Completed',
    },
    {
        id: 'ord-3',
        productId: '9',
        buyerName: 'Ngozi Okonjo-Iweala',
        orderDate: subDays(now, 4).toISOString(),
        status: 'Canceled',
    },
    {
        id: 'ord-4',
        productId: '10',
        buyerName: 'David Adeleke',
        orderDate: subDays(now, 5).toISOString(),
        status: 'Completed',
    },
];
