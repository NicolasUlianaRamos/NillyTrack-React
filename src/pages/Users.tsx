import { Helmet } from "react-helmet-async";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Book, Star } from "lucide-react";
import { Link } from "react-router-dom";


import { useEffect, useState } from "react";
import api from '@/utils/api';

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/users');
        setUsers(data?.users || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erro ao buscar usuários.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <main className="container py-8">
      <Helmet>
        <title>Usuários — NillyTrack</title>
        <meta name="description" content="Conheça outros leitores e veja seus perfis." />
      </Helmet>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Comunidade de Leitores</h1>
          <p className="text-muted-foreground mt-2">
            Conheça outros apaixonados por leitura e suas estatísticas
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading && <p className="text-center col-span-full">Carregando usuários...</p>}
          {error && <p className="text-center col-span-full text-destructive">{error}</p>}
          {!loading && !error && users.length === 0 && <p className="text-center col-span-full">Nenhum usuário encontrado.</p>}
          {users.map((user: any) => (
            <Card key={user.id || user._id} className="group hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Membro desde {user.joinDate}
                    </p>
                  </div>
                </div>
                {user.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {user.bio}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                      <Book className="h-3 w-3" />
                      Livros
                    </div>
                    <div className="font-bold text-lg">{user.booksRead}</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                      <Star className="h-3 w-3" />
                      Reviews
                    </div>
                    <div className="font-bold text-lg">{user.reviewsWritten}</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                      <Star className="h-3 w-3" />
                      Média
                    </div>
                    <div className="font-bold text-lg">{user.averageRating}</div>
                  </div>
                </div>
                
                <Button asChild className="w-full" variant="outline">
                  <Link to={`/perfil/${user.id}`}>Ver Perfil</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Users;