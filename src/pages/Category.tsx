import { Helmet } from 'react-helmet-async';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useCategoryBooks } from '@/hooks/useCategoryBooks';
import { useEffect } from 'react';
import { ItemCard } from '@/components/ItemCard';
import { Button } from '@/components/ui/button';

const DEFAULT_LIMIT = 20;

const CategoryPage = () => {
  const { category = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const pageParam = Math.max(parseInt(params.get('page') || '1', 10), 1);
  const limitParam = (() => { const l = parseInt(params.get('limit') || String(DEFAULT_LIMIT), 10); return l>0 && l<=40 ? l : DEFAULT_LIMIT; })();
  const state = useCategoryBooks(category, pageParam, limitParam);

  // keep URL in sync when page changes
  useEffect(() => {
    navigate(`/categoria/${encodeURIComponent(category)}?page=${state.page}&limit=${limitParam}`, { replace: true });
  }, [state.page, category, limitParam, navigate]);

  return (
    <main>
      <Helmet>
        <title>Categoria {category} — NillyTrack</title>
        <meta name="robots" content="index,follow" />
      </Helmet>
      <section className="container py-8 space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">Categoria: {category}</h1>
          <Button asChild variant="outline" className="rounded-full ml-auto"><Link to="/">Voltar</Link></Button>
        </div>
        {state.error && <div className="text-sm text-destructive">{state.error}</div>}
        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
          {state.loading && <span>Carregando...</span>}
          {!state.loading && <span>{state.items.length} resultados (página {state.page})</span>}
        </div>
  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {state.items.map(b => (
            <ItemCard key={b.id} item={{ id: b.id, type: 'book', title: b.title || 'Sem título', cover: b.cover || '/placeholder.svg', description: '', author: b.authors?.[0] || 'Autor desconhecido', averageRating: b.averageRating, reviewCount: b.reviewCount }} />
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button variant="outline" size="sm" disabled={state.page<=1 || state.loading} onClick={()=> state.setPage(Math.max(1,state.page-1))}>Anterior</Button>
          <span className="text-sm text-muted-foreground select-none">Página {state.page}{state.loading && <span className="ml-2 animate-pulse">...</span>}</span>
          <Button variant="outline" size="sm" disabled={state.loading || state.items.length < state.limit} onClick={()=> state.setPage(state.page+1)}>Próxima</Button>
        </div>
      </section>
    </main>
  );
};

export default CategoryPage;
