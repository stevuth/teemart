'use server';

/**
 * @fileOverview Recommends similar products based on the item a user is currently viewing.
 *
 * - recommendProducts - A function that handles the product recommendation process.
 * - RecommendProductsInput - The input type for the recommendProducts function.
 * - RecommendProductsOutput - The return type for the recommendProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendProductsInputSchema = z.object({
  productName: z.string().describe('The name of the product currently being viewed.'),
  productDescription: z.string().describe('A detailed description of the product.'),
  productCategory: z.string().describe('The category of the product (e.g., Cars, Electronics).'),
  userHistory: z.string().optional().describe('The user history of interaction with listings.'),
});
export type RecommendProductsInput = z.infer<typeof RecommendProductsInputSchema>;

const RecommendProductsOutputSchema = z.object({
  recommendedProducts: z.array(
    z.object({
      name: z.string().describe('The name of the recommended product.'),
      description: z.string().describe('A brief description of the recommended product.'),
      category: z.string().describe('The category of the recommended product.'),
      reason: z.string().describe('Why this product is being recommended.'),
    })
  ).describe('A list of recommended products similar to the viewed item.'),
});
export type RecommendProductsOutput = z.infer<typeof RecommendProductsOutputSchema>;

export async function recommendProducts(input: RecommendProductsInput): Promise<RecommendProductsOutput> {
  return recommendProductsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendProductsPrompt',
  input: {schema: RecommendProductsInputSchema},
  output: {schema: RecommendProductsOutputSchema},
  prompt: `You are an AI assistant helping users find similar products in an online marketplace.

  Based on the details of the product the user is currently viewing, recommend other products that might be of interest.
  Consider the product's name, description, and category. Also take into consideration user's history of interaction with listings.

  Current Product:
  Name: {{{productName}}}
  Description: {{{productDescription}}}
  Category: {{{productCategory}}}
  User History: {{{userHistory}}}

  Please provide a list of recommended products with their names, descriptions, categories, and a brief reason for the recommendation.
  Format your response as a JSON object matching the RecommendProductsOutputSchema.
  `,
});

const recommendProductsFlow = ai.defineFlow(
  {
    name: 'recommendProductsFlow',
    inputSchema: RecommendProductsInputSchema,
    outputSchema: RecommendProductsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
