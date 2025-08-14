
import type { Order } from './types';
import { subDays } from 'date-fns';

const now = new Date();

export const orders: Order[] = [];
