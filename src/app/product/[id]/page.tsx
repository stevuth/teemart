
"use server"

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProductWithSeller } from '@/lib/types';
import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from '@/components/product-detail-client';

type Props = {
  params: { id: string }
}

async function getProduct(id: string): Promise<ProductWithSeller | null> {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    );

    const { data, error } = await supabase
        .from('products')
        .select(`*, seller:profiles(id, full_name, avatar_url, is_verified)`)
        .eq('id', id)
        .single();

    if (error || !data) {
        return null;
    }
    
    const sellerData = data.seller as any;
    return {
        ...data,
        image: data.image_url || [],
        postedDate: data.created_at,
        deliveryFee: data.delivery_fee,
        price: data.price || 0,
        category: data.category || '',
        location: data.location || '',
        city: data.city || '',
        condition: data.condition || 'Used',
        description: data.description || '',
        seller: {
            id: sellerData.id,
            full_name: sellerData.full_name || 'TeeMart Seller',
            avatar_url: sellerData.avatar_url,
            is_verified: sellerData.is_verified || false,
        }
    } as ProductWithSeller;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id
  const product = await getProduct(id)

  if (!product) {
    return {
      title: 'Product Not Found | TeeMart',
      description: 'The product you are looking for could not be found.',
    }
  }
  
  const previousImages = (await parent).openGraph?.images || []
  const displayImage = Array.isArray(product.image) && product.image.length > 0 ? product.image[0] : (product.image as string || '');

  return {
    title: `${product.name} | TeeMart Marketplace`,
    description: product.description.substring(0, 160),
    openGraph: {
      title: `${product.name} on TeeMart`,
      description: product.description.substring(0, 160),
      images: [displayImage, ...previousImages],
      url: `/product/${product.id}`,
      type: 'article',
    },
    twitter: {
        card: 'summary_large_image',
        title: `${product.name} on TeeMart`,
        description: product.description.substring(0, 160),
        images: [displayImage],
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
    const product = await getProduct(params.id);

    if (!product) {
        notFound();
    }

    return <ProductDetailClient product={product} />;
}
