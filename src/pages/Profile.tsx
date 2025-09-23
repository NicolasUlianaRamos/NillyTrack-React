import { Helmet } from "react-helmet-async";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Calendar, Book, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api from '@/utils/api';
import useAuth from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfileStats {
  totalReviews: number;
  totalBooksRead: number;
  averageGivenRating: number;
}

interface ActivityItem {
  type: string; // 'review' etc
  date: string;
  title: string;
  rating?: number;
  text?: string;
}

interface FetchedProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  premiumUntil?: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

const Profile = () => {
  const { userId } = useParams();
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<FetchedProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveId = userId || authUser?._id; // Se não passar userId usa o logado
  // Considera próprio perfil se: (a) não há userId explícito (rota /perfil) OU (b) userId === authUser._id
  const isOwnProfile = (!userId && !!authUser?._id) || (userId !== undefined && authUser?._id === userId);

  useEffect(() => {
    let ignore = false;
    const fetchProfile = async () => {
      if (authLoading) return; // espera auth inicial
      if (!effectiveId) return; // aguarda ter o id do usuário logado
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/users/${effectiveId}`);
        if (ignore) return;
        const u = data.user || data;
        setProfile(u || null);
        setStats(data.stats || null);
        setActivity(data.activity || []);
      } catch (err: any) {
        if (ignore) return;
        if (err?.response?.status === 401) {
          setError('Acesso negado!');
        } else {
          const msg = err?.response?.data?.message || 'Erro ao carregar perfil.';
          setError(msg);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchProfile();
    return () => { ignore = true; };
  }, [effectiveId, isOwnProfile, authLoading]);

  if (loading || authLoading) {
    return (
      <main className="container py-8">
        <p className="text-muted-foreground">Carregando perfil...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="container py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">{error === 'Acesso negado!' ? 'Acesso negado!' : 'Usuário não encontrado'}</h1>
          {error && <p className="text-sm text-muted-foreground">{error}</p>}
          <Button asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-8">
      <Helmet>
        <title>{isOwnProfile ? 'Meu Perfil' : `Perfil de ${profile.name}`} — NillyTrack</title>
        <meta name="description" content="Gerencie seu perfil e veja suas estatísticas." />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Mobile header: avatar + nome lado a lado; detalhes abaixo */}
        <div className="md:hidden space-y-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 rounded-full ring-2 ring-primary/30 shadow">
              {(profile.avatarUrl || profile.avatar) && (
                <AvatarImage
                  src={profile.avatarUrl || profile.avatar || ''}
                  alt={profile.name}
                  className="object-cover rounded-full"
                />
              )}
              <AvatarFallback className="text-xl">
                {profile.name?.[0]?.toUpperCase() || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            {(() => {
              const isPremium = profile.premiumUntil && new Date(profile.premiumUntil) > new Date();
              return (
                <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                  {profile.name}
                  {isPremium && (
                    <span
                      title={`Premium até ${new Date(profile.premiumUntil!).toLocaleDateString()}`}
                      className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-[0_0_6px_rgba(251,191,36,0.6)] tracking-[0.18em] uppercase font-semibold inline-flex items-center gap-1"
                    >
                      <span className="animate-pulse">★</span> Premium
                    </span>
                  )}
                </h1>
              );
            })()}
          </div>
          {/* Demais detalhes permanecem abaixo no mobile */}
          {profile.email && (
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Mail className="h-4 w-4" />
              <span>{profile.email}</span>
            </div>
          )}
          <div className={`flex items-center gap-2 text-muted-foreground ${profile.email ? 'mt-1' : 'mt-2'}`}>
            <Calendar className="h-4 w-4" />
            <span>Membro desde {format(new Date(profile.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
          {profile.bio && (
            <p className="text-sm text-muted-foreground mt-3 max-w-prose whitespace-pre-line">
              {profile.bio}
            </p>
          )}
          {isOwnProfile && authUser?._id && (
            <Button asChild variant="outline" className="mt-2 w-fit">
              <Link to={`/perfil/editar/${authUser._id}`}>Editar Perfil</Link>
            </Button>
          )}
        </div>

        {/* Desktop header: como antes, avatar à esquerda e todos detalhes à direita */}
        <div className="hidden md:flex flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24 rounded-full ring-2 ring-primary/30 shadow">
            {(profile.avatarUrl || profile.avatar) && (
              <AvatarImage
                src={profile.avatarUrl || profile.avatar || ''}
                alt={profile.name}
                className="object-cover rounded-full"
              />
            )}
            <AvatarFallback className="text-2xl">
              {profile.name?.[0]?.toUpperCase() || <User className="h-12 w-12" />}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {(() => {
              const isPremium = profile.premiumUntil && new Date(profile.premiumUntil) > new Date();
              return (
                <h1 className="text-3xl font-bold flex items-center gap-2 flex-wrap">
                  {profile.name}
                  {isPremium && (
                    <span
                      title={`Premium até ${new Date(profile.premiumUntil!).toLocaleDateString()}`}
                      className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-[0_0_6px_rgba(251,191,36,0.6)] tracking-[0.18em] uppercase font-semibold inline-flex items-center gap-1"
                    >
                      <span className="animate-pulse">★</span> Premium
                    </span>
                  )}
                </h1>
              );
            })()}
            {profile.email && (
              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
            )}
            <div className={`flex items-center gap-2 text-muted-foreground ${profile.email ? 'mt-1' : 'mt-2'}`}>
              <Calendar className="h-4 w-4" />
              <span>Membro desde {format(new Date(profile.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-3 max-w-prose whitespace-pre-line">
                {profile.bio}
              </p>
            )}
          </div>

          {isOwnProfile && authUser?._id && (
            <Button asChild variant="outline">
              <Link to={`/perfil/editar/${authUser._id}`}>Editar Perfil</Link>
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livros Lidos</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBooksRead ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews Escritas</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalReviews ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nota Média</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageGivenRating ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activity.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem atividade recente.</p>
              )}
              {activity.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">
                      {item.type === 'review' ? 'Avaliou' : 'Atividade'} "{item.title}"
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.rating ? `${item.rating} estrelas • ` : ''}
                      {format(new Date(item.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                    {item.text && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{item.text}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Profile;