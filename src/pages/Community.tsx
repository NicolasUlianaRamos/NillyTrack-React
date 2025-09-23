import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/utils/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Helmet } from 'react-helmet-async';

interface CommunityUser { _id: string; name: string; avatarUrl?: string; bio?: string; createdAt?: string; }
interface ApiResponse { users: CommunityUser[]; total: number; page: number; limit: number; totalPages: number; }

const useDebouncedValue = (value: string, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
};

export default function Community() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const qParam = sp.get('q') || '';
  const pageParam = Math.max(parseInt(sp.get('page') || '1', 10), 1);
  const limitParam = Math.min(Math.max(parseInt(sp.get('limit') || '12', 10), 1), 50);
  const [q, setQ] = useState(qParam);
  const [page, setPage] = useState(pageParam);
  const [limit] = useState(limitParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse>({ users: [], total: 0, page: pageParam, limit: limitParam, totalPages: 0 });
  const qDeb = useDebouncedValue(q, 500);

  // Sincroniza estado->URL
  useEffect(() => {
    const next = new URLSearchParams(sp);
    if (q) next.set('q', q); else next.delete('q');
    next.set('page', String(page));
    next.set('limit', String(limit));
    setSp(next, { replace: true });
  }, [q, page, limit]);

  // Reage a mudanças de URL externas
  useEffect(() => {
    const qp = sp.get('q') || '';
    const pp = Math.max(parseInt(sp.get('page') || '1', 10), 1);
    const lp = Math.min(Math.max(parseInt(sp.get('limit') || '12', 10), 1), 50);
    setQ(qp); setPage(pp);
  }, [sp]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true); setError(null);
        const { data } = await api.get<ApiResponse>('/users/community', { params: { q: qDeb, page, limit, sort: 'recent' }, signal: controller.signal });
        setData(data);
      } catch (e: any) {
        if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return;
        setError(e?.response?.data?.message || e.message || 'Erro ao carregar comunidade.');
      } finally { setLoading(false); }
    };
    load();
    return () => controller.abort();
  }, [qDeb, page, limit]);

  const totalPages = data.totalPages || 0;
  const canPrev = page > 1;
  const canNext = totalPages === 0 ? false : page < totalPages;

  return (
    <main className="container py-8">
      <Helmet>
        <title>Comunidade — NillyTrack</title>
        <meta name="description" content="Conheça leitores da comunidade NillyTrack e encontre perfis." />
      </Helmet>

      <h1 className="text-2xl font-bold mb-4">Comunidade</h1>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6">
        <Input value={q} onChange={e => { setPage(1); setQ(e.target.value); }} placeholder="Buscar usuário pelo nome" />
        <div className="flex gap-2">
          <Button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={!canPrev} variant="outline">Anterior</Button>
          <Button onClick={() => setPage(p => p + 1)} disabled={!canNext}>Próxima</Button>
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Carregando…</p>}
      {error && <p className="text-destructive">{error}</p>}

      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data.users.map(u => (
          <article key={u._id} className="rounded-lg border bg-card p-3 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={u.name} /> : null}
                <AvatarFallback>{(u.name?.[0] || 'U').toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">{u.name}</p>
                {u.bio ? <p className="text-xs text-muted-foreground line-clamp-2">{u.bio}</p> : null}
              </div>
            </div>
            <Button variant="soft" onClick={() => navigate(`/perfil/${u._id}`)}>Ver perfil</Button>
          </article>
        ))}
      </section>

      <div className="flex items-center justify-center gap-3 mt-6">
        <Button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={!canPrev} variant="outline">Anterior</Button>
        <span className="text-sm text-muted-foreground">Página {page} {totalPages ? `de ${totalPages}` : ''}</span>
        <Button onClick={() => setPage(p => p + 1)} disabled={!canNext}>Próxima</Button>
      </div>
    </main>
  );
}
