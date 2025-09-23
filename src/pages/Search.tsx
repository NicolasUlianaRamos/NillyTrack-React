import { Helmet } from 'react-helmet-async';
import { FormEvent, useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSearchBooks } from '@/hooks/useSearchBooks';
import { ItemCard } from '@/components/ItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DEFAULT_LIMIT = 20;

const SearchPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialQ = params.get('q') || '';
  const initialPage = Math.max(parseInt(params.get('page') || '1', 10), 1);
  const initialLimit = (() => { const l = parseInt(params.get('limit') || String(DEFAULT_LIMIT), 10); return l>0 && l<=40 ? l : DEFAULT_LIMIT; })();
  const [q, setQ] = useState(initialQ);
  const [committedQ, setCommittedQ] = useState(initialQ);
  const [limit, setLimit] = useState(initialLimit);

  const search = useSearchBooks(committedQ, { limit, initialPage });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
  // Sempre reinicia a paginação ao fazer uma nova busca
  search.setPage(1);
    setCommittedQ(query);
    navigate(query ? `/busca?q=${encodeURIComponent(query)}&page=1&limit=${limit}` : '/busca');
  };

  // Redirect se acessarem /busca sem q? -> só mostra formulário vazio.

  // Atualizar URL quando paginação mudar (após já ter query)
  useEffect(() => {
    if (!committedQ) return;
    navigate(`/busca?q=${encodeURIComponent(committedQ)}&page=${search.page}&limit=${limit}`, { replace: true });
  }, [search.page, committedQ, limit, navigate]);

  return (
    <main>
      <Helmet>
        <title>Buscar livros — NillyTrack</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={typeof window!=='undefined'? window.location.href: ''} />
      </Helmet>

      <section className="container py-8">
        <form onSubmit={onSubmit} className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 min-w-[240px]">
            <Input
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder="Buscar livros..."
              aria-label="Buscar"
              className="rounded-full"
            />
          </div>
          <Button type="submit" disabled={committedQ===q.trim() && search.loading} aria-busy={committedQ===q.trim() && search.loading} className="rounded-full px-6">
            {committedQ===q.trim() && search.loading ? 'Buscando...' : 'Buscar'}
          </Button>
          <select
            className="h-10 rounded-full border border-input bg-background px-3 text-sm"
            value={limit}
            onChange={(e)=>{ const nl = parseInt(e.target.value,10); setLimit(nl); if (committedQ){ search.setPage(1); navigate(`/busca?q=${encodeURIComponent(committedQ)}&page=1&limit=${nl}`);} }}
            aria-label="Itens por página"
          >
            {[10,20,30,40].map(n=> <option key={n} value={n}>{n}/página</option>)}
          </select>
          {committedQ && (
            <Button type="button" variant="ghost" onClick={()=>{ setQ(''); setCommittedQ(''); search.setPage(1); navigate('/busca'); }}>Limpar</Button>
          )}
          <Button variant="outline" asChild className="ml-auto rounded-full">
            <Link to="/">Voltar à Home</Link>
          </Button>
        </form>
      </section>

      <section className="container pb-12">
        {!committedQ && (
          <p className="text-sm text-muted-foreground">Digite um termo e clique em Buscar.</p>
        )}
        {committedQ && (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              {search.loading && <span>Carregando...</span>}
              {!search.loading && <span>{search.items.length} resultados (página {search.page}{search.meta?.total ? ` de ${Math.ceil(search.meta.total/limit)}`:''})</span>}
              {search.meta?.total !== undefined && <span>Total: {search.meta.total}</span>}
            </div>
            {search.error && <div className="text-sm text-destructive">{search.error}</div>}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {search.items.map(b=> {
                const author = b.authors?.[0] || 'Autor desconhecido';
                return (
                  <ItemCard
                    key={b.id}
                    item={{
                      id: b.id,
                      type: 'book',
                      title: b.title || 'Sem título',
                      cover: b.cover || '/placeholder.svg',
                      description: '',
                      author,
                      averageRating: typeof b.averageRating === 'number' ? b.averageRating : undefined,
                      reviewCount: typeof b.reviewCount === 'number' ? b.reviewCount : undefined,
                    }}
                  />
                );
              })}
            </div>
            {committedQ && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <Button variant="outline" size="sm" disabled={search.page<=1 || search.loading} onClick={()=> search.setPage(Math.max(search.page-1,1))}>Anterior</Button>
                <span className="text-sm text-muted-foreground select-none">Página {search.page}{search.loading && <span className="ml-2 animate-pulse">...</span>}</span>
                <Button variant="outline" size="sm" disabled={!search.hasMore || search.loading} onClick={()=> search.setPage(search.page+1)}>Próxima</Button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default SearchPage;
