import { Helmet } from "react-helmet-async";
import hero from "@/assets/hero-books.jpg";
import { FormEvent, useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useHomeBooks } from "@/hooks/useHomeBooks";
import { useSearchBooks } from "@/hooks/useSearchBooks";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const Index = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialQ = params.get("q") ?? "";
  // Se a home receber ?q= redirecionar para /busca preservando querystring inteira
  useEffect(() => {
    if (initialQ) {
      const qs = params.toString();
      navigate(`/busca${qs ? `?${qs}` : ''}`, { replace: true });
    }
  }, [initialQ, params, navigate]);
  const [q, setQ] = useState("");
  const [view, setView] = useState<"books">("books"); // outras abas removidas enquanto não houver dados reais
  // limit apenas para consistência do form (valor fixo)
  const limit = 20;
  
  // Hook para carregar categorias reais da API (/books/home)
  const home = useHomeBooks();

  // Lista de categorias reais (sem mock). Antes de carregar fica vazia e mostramos skeleton.
  const categoriesList = home.requested?.length ? home.requested.map(c => ({ name: c, key: c })) : [];

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
  if (query) navigate(`/busca?q=${encodeURIComponent(query)}&page=1&limit=${limit}`); else navigate("/");
  };

  // (Busca local removida junto com dados mock)

  const getBooksByCategory = (categoryKey: string) => home.categories[categoryKey] || [];

  return (
    <main className="">
      <Helmet>
        <title>NillyTrack — Descubra livros, filmes e séries</title>
        <meta name="description" content="Explore, avalie e organize sua biblioteca com NillyTrack." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>

      <section className="relative overflow-hidden min-h-[350px] md:min-h-[420px]">
        <img src={hero} alt="Banner de leitura: estante e luz aconchegante" className="w-full h-full object-cover absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-background/95" />
        <div className="relative container flex flex-col justify-end py-10 md:py-12 min-h-[350px] md:min-h-[420px]">
          <div className="space-y-5">
            <h1 className="text-3xl md:text-4xl font-bold max-w-2xl">Descubra histórias, compartilhe reviews e monte sua biblioteca</h1>
            <p className="text-muted-foreground max-w-2xl">Livros, filmes e séries em um só lugar. Pesquise pelo topo e comece agora.</p>
            <div className="flex flex-wrap gap-3 py-2">
              <Button asChild variant="hero"><Link to="#grid">Começar a explorar</Link></Button>
              <Button asChild variant="soft"><Link to="/cadastro">Criar conta</Link></Button>
              <Button asChild variant="outline"><Link to="/assinatura">✨ Premium</Link></Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="container py-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={onSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Pesquisar livros..."
                aria-label="Pesquisar"
                className="pl-10 pr-4 py-2 rounded-full shadow-md border border-input focus:border-transparent focus:outline-none focus:shadow-lg focus:shadow-primary/20 transition-all bg-background/80 backdrop-blur-md"
              />
            </div>
            <Button
              type="submit"
              className="rounded-full px-6 shadow-md h-10"
              disabled={false}
              aria-busy={false}
            >
              Buscar
            </Button>
            {/* Removido seletor de limite conforme pedido (mantido valor currente via estado) */}
          </form>
        </div>
      </section>

      <section className="container py-8" id="grid">
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Button variant={"default"}>Livros</Button>
          <div className="ml-auto text-sm text-muted-foreground" />
        </div>
        
        {/* Search Results or Category Sections */}
        {view === "books" && (
          <div className="space-y-12">
            {home.loading && categoriesList.length === 0 && (
              <div className="space-y-8" aria-busy="true" aria-label="Carregando livros">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <div className="h-6 w-48 bg-muted/40 rounded animate-pulse" />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div key={j} className="aspect-[2/3] w-full bg-muted/30 rounded-md animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!home.loading && !home.error && categoriesList.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma categoria disponível.</p>
            )}
            {categoriesList.map((category) => {
              const categoryBooks = getBooksByCategory(category.key);
              if (!categoryBooks.length) return null;
              return (
                <div key={category.key} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{category.name}</h2>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/categoria/${encodeURIComponent(category.key)}`}>Ver todos</Link>
                    </Button>
                  </div>
          <div className="relative px-2">
                    <Carousel className="w-full">
                      <CarouselContent className="-ml-2 md:-ml-4">
                        {categoryBooks.map((book) => (
              <CarouselItem key={book.id} className="pl-2 md:pl-4 basis-[65%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                            <ItemCard item={{
                              id: book.id,
                              type: 'book',
                              title: book.title,
                              cover: book.cover,
                              description: book.description || '',
                              author: (book as any).author || (book as any)._raw?.authors?.[0] || 'Autor desconhecido',
                              averageRating: (book as any).rating ?? (book as any).averageRating ?? (book as any)._raw?.averageRating ?? 0,
                              reviewCount: (book as any).ratingsCount ?? (book as any).reviewCount ?? (book as any)._raw?.reviewCount ?? 0,
                            }} />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
            <CarouselPrevious className="-left-2 hidden sm:flex" />
            <CarouselNext className="-right-2 hidden sm:flex" />
                    </Carousel>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {/* Status / debug simples */}
  {view === 'books' && (
        <div className="container pb-8">
          {home.error && (
            <div className="text-sm text-destructive mb-4 flex items-center gap-2">
              <span>Erro: {home.error}</span>
              <Button size="sm" variant="outline" onClick={home.refresh}>Tentar novamente</Button>
            </div>
          )}
          <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
            {home.cacheStatus && <span>Cache: {home.cacheStatus}</span>}
            {home.lastUpdated && <span>Atualizado há {Math.round((Date.now()-home.lastUpdated)/1000)}s</span>}
            <Button size="sm" variant="ghost" onClick={home.refresh}>Atualizar</Button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Index;
