interface Product {
  id: number;
  title: string;
  price: number;
  description?: string;
  category: string;
  image: string;
  rating: { rate: number; count: number };
}

interface ApiSource {
  name: string;
  baseUrl: string;
  transform: (data: any) => Product[];
}

// Multiple API sources for product data
const API_SOURCES: ApiSource[] = [
  {
    name: 'FakeStore',
    baseUrl: 'https://fakestoreapi.com/products',
    transform: (data) => Array.isArray(data) ? data : [data],
  },
  {
    name: 'DummyJSON',
    baseUrl: 'https://dummyjson.com/products',
    transform: (data) => {
      const products = data.products || [];
      return products.map((item: any) => ({
        id: item.id + 1000, // Offset IDs to avoid conflicts
        title: item.title,
        price: item.price,
        description: item.description,
        category: item.category,
        image: item.thumbnail || item.images?.[0] || '',
        rating: { rate: item.rating || 4.0, count: item.stock || 100 },
      }));
    },
  },
];

export const productApi = {
  // Fetch products from all sources
  async fetchAllProducts(limit?: number): Promise<Product[]> {
    try {
      const allProducts: Product[] = [];

      // Fetch from FakeStore API
      const fakeStoreResponse = await fetch(
        limit ? `${API_SOURCES[0].baseUrl}?limit=${limit}` : API_SOURCES[0].baseUrl
      );
      if (fakeStoreResponse.ok) {
        const fakeStoreData = await fakeStoreResponse.json();
        allProducts.push(...API_SOURCES[0].transform(fakeStoreData));
      }

      // Fetch from DummyJSON API
      if (!limit || limit > 20) {
        const dummyResponse = await fetch(`${API_SOURCES[1].baseUrl}?limit=${limit || 30}`);
        if (dummyResponse.ok) {
          const dummyData = await dummyResponse.json();
          allProducts.push(...API_SOURCES[1].transform(dummyData));
        }
      }

      return allProducts;
    } catch (error) {
      console.error('Error fetching products from multiple sources:', error);
      // Fallback to FakeStore only
      const response = await fetch(
        limit ? `${API_SOURCES[0].baseUrl}?limit=${limit}` : API_SOURCES[0].baseUrl
      );
      return response.json();
    }
  },

  // Fetch single product by ID
  async fetchProductById(id: number): Promise<Product | null> {
    try {
      // Check which source the ID belongs to
      if (id < 1000) {
        // FakeStore API
        const response = await fetch(`${API_SOURCES[0].baseUrl}/${id}`);
        if (response.ok) {
          return response.json();
        }
      } else {
        // DummyJSON API
        const realId = id - 1000;
        const response = await fetch(`https://dummyjson.com/products/${realId}`);
        if (response.ok) {
          const data = await response.json();
          return API_SOURCES[1].transform({ products: [data] })[0];
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Fetch all categories from all sources
  async fetchAllCategories(): Promise<string[]> {
    try {
      const categories = new Set<string>();

      // FakeStore categories
      const fakeStoreResponse = await fetch('https://fakestoreapi.com/products/categories');
      if (fakeStoreResponse.ok) {
        const fakeStoreCategories = await fakeStoreResponse.json();
        fakeStoreCategories.forEach((cat: string) => categories.add(cat));
      }

      // DummyJSON categories
      const dummyResponse = await fetch('https://dummyjson.com/products/categories');
      if (dummyResponse.ok) {
        const dummyCategories = await dummyResponse.json();
        dummyCategories.forEach((cat: any) => {
          const categoryName = typeof cat === 'string' ? cat : cat.slug || cat.name;
          categories.add(categoryName);
        });
      }

      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      const response = await fetch('https://fakestoreapi.com/products/categories');
      return response.json();
    }
  },

  // Search products across all sources
  async searchProducts(query: string): Promise<Product[]> {
    const allProducts = await this.fetchAllProducts();
    const searchTerm = query.toLowerCase();
    return allProducts.filter(
      (product) =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm)
    );
  },
};
