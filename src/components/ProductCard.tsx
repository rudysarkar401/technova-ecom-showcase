import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  id: number;
  title: string;
  price: number;
  image: string;
  rating?: { rate: number; count: number };
  category?: string;
}

export const ProductCard = ({ id, title, price, image, rating, category }: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id, title, price, image });
  };

  return (
    <Link to={`/product/${id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50">
        <CardContent className="p-4">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted mb-4">
            <img
              src={image}
              alt={title}
              className="h-full w-full object-contain transition-transform group-hover:scale-110"
            />
          </div>
          {category && (
            <p className="text-xs text-muted-foreground uppercase mb-2">{category}</p>
          )}
          <h3 className="font-semibold line-clamp-2 mb-2 min-h-[2.5rem]">{title}</h3>
          <div className="flex items-center gap-2 mb-3">
            {rating && (
              <>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{rating.rate.toFixed(1)}</span>
                </div>
                <span className="text-xs text-muted-foreground">({rating.count})</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">${price.toFixed(2)}</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            className="w-full gradient-primary hover:opacity-90 transition-opacity"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};
