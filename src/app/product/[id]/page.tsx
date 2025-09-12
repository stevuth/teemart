
"use server"

import { ProductWithSeller } from '@/lib/types';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from '@/components/product-detail-client';

type Props = {
  params: { id: string }
}

async function getProduct(id: string): Promise<ProductWithSeller | null> {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
        .from('products')
        .select(`*, seller:profiles(id, full_name, avatar_url, is_verified)`)
        .eq('id', id)
        .single();

    if (error || !data) {
        return null;
    }
    
    const getPublicUrl = (path: string) => {
        // If it's already a full URL, return it
        if (path.startsWith('http')) return path;
        // Otherwise, construct the public URL
        return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
    };
    
    const imageUrls = (data.image_url || []).map(getPublicUrl);

    const sellerData = data.seller as any;
    return {
        ...data,
        image: imageUrls,
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
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.teemart.ng';

  return {
    title: `${product.name} | TeeMart Marketplace`,
    description: product.description.substring(0, 160),
    alternates: {
      canonical: `${siteUrl}/product/${product.id}`,
    },
    openGraph: {
      title: `${product.name} on TeeMart`,
      description: product.description.substring(0, 160),
      images: [displayImage, ...previousImages],
      url: `${siteUrl}/product/${product.id}`,
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

function ProductJsonLd({ product }: { product: ProductWithSeller }) {
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.teemart.ng';
  const productUrl = `${siteUrl}/product/${product.id}`;
  const displayImage = Array.isArray(product.image) && product.image.length > 0 ? product.image[0] : (product.image as string || '');

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: displayImage,
    description: product.description,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'NGN',
      price: product.price.toString(),
      availability: 'https://schema.org/InStock',
      itemCondition: `https://schema.org/${product.condition}Condition`,
      seller: {
        '@type': 'Organization',
        name: product.seller.full_name,
      }
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category,
        item: `${siteUrl}?category=${encodeURIComponent(product.category)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}


export default async function ProductDetailPage({ params }: Props) {
    const product = await getProduct(params.id);

    if (!product) {
        notFound();
    }

    return (
      <>
        <ProductJsonLd product={product} />
        <ProductDetailClient product={product} />
      </>
    );
}
