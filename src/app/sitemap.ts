
import { MetadataRoute } from 'next';
import { createSupabaseServerClient } from '@/utils/supabase/server';

// Revalidate this page every 24 hours
export const revalidate = 86400; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.teemart.ng';

  // 1. Get static routes
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/help',
    '/privacy',
    '/safety-tips',
    '/terms',
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 2. Get dynamic product routes
  const { data: products, error } = await supabase
    .from('products')
    .select('id, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching products for sitemap:", error);
    return staticRoutes; // Return only static routes on error
  }

  const productRoutes = products.map((product) => ({
    url: `${siteUrl}/product/${product.id}`,
    lastModified: new Date(product.created_at).toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...productRoutes];
}
