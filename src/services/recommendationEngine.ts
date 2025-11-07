import { supabase } from '@/integrations/supabase/client';
import { productApi } from './productApi';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
  rating: { rate: number; count: number };
  category: string;
}

interface Recommendation {
  product_id: number;
  score: number;
  reason: string;
}

export const recommendationEngine = {
  /**
   * Get personalized product recommendations for a user
   * @param userId - The user's UUID
   * @param limit - Maximum number of recommendations to return (default: 8)
   * @returns Array of recommended products with their details
   */
  async getRecommendations(userId: string, limit: number = 8): Promise<Product[]> {
    try {
      // Fetch recommendations from database
      const { data: recommendations, error } = await supabase.rpc(
        'get_product_recommendations',
        {
          p_user_id: userId,
          p_limit: limit,
        }
      );

      if (error) {
        console.error('Error fetching recommendations:', error);
        return [];
      }

      if (!recommendations || recommendations.length === 0) {
        return [];
      }

      // Fetch product details from API
      const productIds = recommendations.map((r: Recommendation) => r.product_id);
      const productsData = await Promise.all(
        productIds.map((id) => productApi.fetchProductById(id))
      );

      // Filter out null products and return
      return productsData.filter((p): p is Product => p !== null);
    } catch (error) {
      console.error('Error in recommendation engine:', error);
      return [];
    }
  },

  /**
   * Get fallback recommendations when personalized recommendations are not available
   * Returns popular products based on category diversity
   */
  async getFallbackRecommendations(limit: number = 8): Promise<Product[]> {
    try {
      const products = await productApi.fetchAllProducts(limit * 2);
      
      // Get diverse products across categories
      const categoryCounts = new Map<string, number>();
      const diverseProducts: Product[] = [];

      for (const product of products) {
        const count = categoryCounts.get(product.category) || 0;
        if (count < 2) { // Max 2 products per category
          diverseProducts.push(product);
          categoryCounts.set(product.category, count + 1);
        }
        if (diverseProducts.length >= limit) break;
      }

      return diverseProducts;
    } catch (error) {
      console.error('Error fetching fallback recommendations:', error);
      return [];
    }
  },

  /**
   * Get recommendations with fallback logic
   * First tries personalized recommendations, falls back to popular products if needed
   */
  async getRecommendationsWithFallback(
    userId: string | undefined,
    limit: number = 8
  ): Promise<Product[]> {
    if (!userId) {
      return this.getFallbackRecommendations(limit);
    }

    const personalizedRecs = await this.getRecommendations(userId, limit);
    
    if (personalizedRecs.length === 0) {
      return this.getFallbackRecommendations(limit);
    }

    return personalizedRecs;
  },

  /**
   * Get similar products based on category and price range
   */
  async getSimilarProducts(
    productId: number,
    category: string,
    price: number,
    limit: number = 4
  ): Promise<Product[]> {
    try {
      const allProducts = await productApi.fetchAllProducts();
      
      // Filter by category and similar price range (±30%)
      const priceMin = price * 0.7;
      const priceMax = price * 1.3;
      
      const similar = allProducts
        .filter(p => 
          p.id !== productId && 
          p.category === category &&
          p.price >= priceMin &&
          p.price <= priceMax
        )
        .sort((a, b) => b.rating.rate - a.rating.rate)
        .slice(0, limit);

      return similar;
    } catch (error) {
      console.error('Error fetching similar products:', error);
      return [];
    }
  },
};
