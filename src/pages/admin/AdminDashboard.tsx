import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/utils/api";

type DashboardStats = {
  totalUsers: number;
  activeSubscriptions: number; // usuários com premium ativo
  totalReviews: number;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true); setError(null);
      try {
        // Pega usuários e premium ativos
        const [usersRes, reviewsRes] = await Promise.all([
          api.get('/users/admin/stats'), // { totalUsers, totalAdmins, totalPremium }
          api.get('/reviews/admin/stats') // { total, byType }
        ]);
        if (ignore) return;
        const totalUsers = usersRes.data?.totalUsers ?? 0;
        const activeSubscriptions = usersRes.data?.totalPremium ?? 0; // premiumUntil > now
        const totalReviews = reviewsRes.data?.total ?? 0;
        setStats({ totalUsers, activeSubscriptions, totalReviews });
      } catch (e: any) {
        if (ignore) return;
        setError(e?.response?.data?.message || 'Erro ao carregar estatísticas.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  return (
    <main className="container py-8">
      <Helmet>
        <title>Admin Dashboard — NillyTrack</title>
        <meta name="description" content="Painel administrativo do NillyTrack." />
      </Helmet>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground">Gerencie usuários, assinaturas e reviews</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : (stats?.totalUsers ?? 0)}</div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : (stats?.activeSubscriptions ?? 0)}</div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Reviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : (stats?.totalReviews ?? 0)}</div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciar Usuários
              </CardTitle>
              <CardDescription>
                Visualize e gerencie todos os usuários da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/usuarios">Ver Usuários</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Gerenciar Assinaturas
              </CardTitle>
              <CardDescription>
                Atualize e gerencie assinaturas de usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/assinaturas">Ver Assinaturas</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Gerenciar Reviews
              </CardTitle>
              <CardDescription>
                Modere e gerencie todas as reviews da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/reviews">Ver Reviews</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;