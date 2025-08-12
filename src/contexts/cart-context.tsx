
"use client";

import { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            setCartItems(JSON.parse(storedCart));
        }
    } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
        setCartItems([]);
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
        console.error("Failed to save cart to localStorage", error);
    }
  }, [cartItems]);

  const addToCart = (product: Product) => {
    let itemAdded = false;
    let itemAlreadyInCart = false;

    const newCartItems = cartItems.map(item => {
        if (item.id === product.id) {
            itemAlreadyInCart = true;
            return { ...item, quantity: item.quantity + 1 };
        }
        return item;
    });

    if (!itemAlreadyInCart) {
        newCartItems.push({ ...product, quantity: 1 });
        itemAdded = true;
    }

    setCartItems(newCartItems);

    if (itemAlreadyInCart) {
        toast({
            title: "Item already in cart",
            description: "You can update the quantity in your cart.",
        });
    } else if (itemAdded) {
        toast({
            title: "Item Added",
            description: `${product.name} has been added to your cart.`,
        });
    }
  };

  const removeFromCart = (productId: string) => {
    const itemToRemove = cartItems.find(item => item.id === productId);
    const newCartItems = cartItems.filter(item => item.id !== productId);
    
    setCartItems(newCartItems);

    if (itemToRemove) {
        toast({
            title: "Item Removed",
            description: `${itemToRemove.name} has been removed from your cart.`,
        });
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
        removeFromCart(productId);
        return;
    }
    setCartItems(prevItems => 
        prevItems.map(item =>
            item.id === productId ? { ...item, quantity: quantity } : item
        )
    );
  };
  
  const clearCart = () => {
    setCartItems([]);
  }
  
  const cartCount = useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
