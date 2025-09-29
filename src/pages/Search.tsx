import { Helmet } from 'react-helmet-async';
import type React from 'react';
import { FormEvent, useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSearchBooks } from '@/hooks/useSearchBooks';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { ItemCard } from '@/components/ItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, X } from 'lucide-react';

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  
  const search = useSearchBooks(committedQ, { limit, initialPage });
  const searchHistory = useSearchHistory();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loggedInitialQRef = useRef<string | null>(null);


  // Se o usuário chegou via URL com ?q=..., garantir que salve no histórico
  useEffect(() => {
    if (initialQ && loggedInitialQRef.current !== initialQ) {
      // Salva no histórico ao carregar a página com uma query já presente
      searchHistory.addSearch(initialQ);
      loggedInitialQRef.current = initialQ;
    }
  }, [initialQ, searchHistory]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query) {
      searchHistory.addSearch(query);
    }
    // Sempre reinicia a paginação ao fazer uma nova busca
    search.setPage(1);
    setCommittedQ(query);
    setShowSuggestions(false);
    navigate(query ? `/busca?q=${encodeURIComponent(query)}&page=1&limit=${limit}` : '/busca');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQ(suggestion);
    searchHistory.addSearch(suggestion);
    search.setPage(1);
    setCommittedQ(suggestion);
    setShowSuggestions(false);
    navigate(`/busca?q=${encodeURIComponent(suggestion)}&page=1&limit=${limit}`);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
    setFocusedSuggestionIndex(-1);
  };

  const handleInputChange = (value: string) => {
    setQ(value);
    setShowSuggestions(true);
    setFocusedSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const suggestions = searchHistory.getFilteredHistory(q);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      if (focusedSuggestionIndex >= 0 && suggestions[focusedSuggestionIndex]) {
        e.preventDefault();
        handleSuggestionClick(suggestions[focusedSuggestionIndex].query);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setFocusedSuggestionIndex(-1);
      inputRef.current?.blur();
    }
  };

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Atualizar refs das sugestões
  useEffect(() => {
    if (focusedSuggestionIndex >= 0 && suggestionRefs.current[focusedSuggestionIndex]) {
      suggestionRefs.current[focusedSuggestionIndex]?.focus();
    }
  }, [focusedSuggestionIndex]);

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
          <div className="flex-1 min-w-[240px] relative">
            <Input
              ref={inputRef}
              value={q}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              placeholder="Buscar livros..."
              aria-label="Buscar"
              className="rounded-full"
              autoComplete="off"
            />
            
            {showSuggestions && (
              <div 
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
              >
                {(() => {
                  const suggestions = searchHistory.getFilteredHistory(q);
                  
                  if (suggestions.length === 0) {
                    return (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        {q.trim() ? 'Nenhuma pesquisa anterior encontrada' : 'Nenhuma pesquisa anterior'}
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="p-2 text-xs font-medium text-muted-foreground border-b border-border flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pesquisas anteriores
                        </span>
                        {searchHistory.history.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              searchHistory.clearHistory();
                              setShowSuggestions(false);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors text-xs"
                          >
                            Limpar tudo
                          </button>
                        )}
                      </div>
                      {suggestions.map((item, index) => (
                        <button
                          key={`${item.query}-${item.timestamp}`}
                          ref={(el) => (suggestionRefs.current[index] = el)}
                          type="button"
                          onClick={() => handleSuggestionClick(item.query)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between group ${
                            index === focusedSuggestionIndex ? 'bg-accent text-accent-foreground' : ''
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {item.query}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              searchHistory.removeSearch(item.query);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all p-1 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </button>
                      ))}
                    </>
                  );
                })()}
              </div>
            )}
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
