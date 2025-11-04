import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { 
  Users, 
  MousePointer, 
  ShoppingCart, 
  CreditCard,
  Eye,
  TrendingUp,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface AnalyticsData {
  total_users: number;
  total_interactions: number;
  total_views: number;
  total_cart_adds: number;
  total_purchases: number;
  popular_categories: Array<{ category: string; count: number }>;
  recent_interactions: Array<{
    user_id: string;
    product_id: number;
    interaction_type: string;
    category: string;
    created_at: string;
  }>;
}

const AdminAnalytics = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
      return;
    }

    const fetchAnalytics = async () => {
      if (!isAdmin) return;

      try {
        const { data, error } = await supabase.rpc('get_admin_analytics');

        if (error) {
          console.error('Error fetching analytics:', error);
          return;
        }

        if (data && data.length > 0) {
          setAnalytics({
            ...data[0],
            popular_categories: (data[0].popular_categories as any) || [],
            recent_interactions: (data[0].recent_interactions as any) || [],
          });
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, adminLoading, navigate]);

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading analytics...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Admin Analytics</h1>
          </div>
          <Badge variant="secondary" className="text-lg">Admin Panel</Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.total_interactions || 0}</div>
              <p className="text-xs text-muted-foreground">All activities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Product Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.total_views || 0}</div>
              <p className="text-xs text-muted-foreground">Total views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cart Additions</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.total_cart_adds || 0}</div>
              <p className="text-xs text-muted-foreground">Items added</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchases</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.total_purchases || 0}</div>
              <p className="text-xs text-muted-foreground">Completed orders</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Popular Categories */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Popular Categories</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {analytics?.popular_categories && analytics.popular_categories.length > 0 ? (
                <div className="space-y-4">
                  {analytics.popular_categories.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium capitalize">{cat.category}</span>
                      </div>
                      <Badge variant="secondary">{cat.count} interactions</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Interactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.recent_interactions && analytics.recent_interactions.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {analytics.recent_interactions.slice(0, 20).map((interaction, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            interaction.interaction_type === 'purchase' ? 'default' :
                            interaction.interaction_type === 'cart_add' ? 'secondary' : 
                            'outline'
                          }>
                            {interaction.interaction_type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Product #{interaction.product_id}
                          </span>
                        </div>
                        {interaction.category && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {interaction.category}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(interaction.created_at), 'MMM d, HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent interactions</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
