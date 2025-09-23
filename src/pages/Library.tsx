import { Helmet } from "react-helmet-async";
import { ItemCard } from "@/components/ItemCard";
import { useLibrary, LibraryStatus } from "@/hooks/useLibrary";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

const Library = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const isAdminView = !!userId;
  
  const { items, loading, reload } = useLibrary(userId ? { adminUserId: userId } : undefined);
  const [activeTab, setActiveTab] = useState<LibraryStatus | "all">("all");
  const byId = new Map(items.map((b) => [b.id, b]));

  const filteredItems = activeTab === "all"
    ? items
    : items.filter(item => item.status === activeTab);
    
  // Constrói objetos prontos para ItemCard, mesclando mock apenas se existir, e garantindo averageRating/reviewCount
  const mine = filteredItems.map(i => {
    const base: any = byId.get(i.id) || {};
    const averageRating = typeof i.averageRating === 'number' ? i.averageRating : (base.averageRating ?? base.rating ?? 0);
    const reviewCount = typeof i.reviewCount === 'number' ? i.reviewCount : (base.reviewCount ?? base.ratingsCount ?? 0);
    return {
      id: i.id,
      type: 'book' as const,
      title: i.title || base.title || 'Título',
      author: i.author || base.author || (base.authors?.[0]) || 'Autor desconhecido',
      cover: i.cover || base.cover || '/placeholder.svg',
      description: base.description || '',
      averageRating,
      reviewCount,
      buyUrl: base.buyUrl || '#'
    } as any; // manter flexível para ItemCard
  });
  
  const statusLabels: Record<LibraryStatus | "all", string> = {
    all: "Todos",
    "quero-ler": "Quero ler",
    "lendo": "Lendo", 
    "lido": "Lidos"
  };
  
  const getCountByStatus = (status: LibraryStatus | "all") => {
    if (status === "all") return items.length;
    return items.filter(item => item.status === status).length;
  };

  return (
    <main className="container py-10">
      <Helmet>
        <title>Minha Biblioteca — NillyTrack</title>
        <meta name="description" content="Livros marcados como lendo, lido e quero ler." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>
      <h1 className="text-2xl font-bold mb-6">
        {isAdminView ? `Biblioteca do Usuário ${userId}` : "Minha Biblioteca"}
      </h1>
      
      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {( ["all", "quero-ler", "lendo", "lido"] as const ).map((status) => {
          const isActive = activeTab === status;
          return (
            <Button
              key={status}
              variant={isActive ? "default" : "outline"}
              onClick={() => setActiveTab(status)}
              className={`flex items-center gap-2 ${isActive ? 'ring-2 ring-primary/60 shadow-sm' : ''}`}
            >
              {statusLabels[status]}
              <span className={`text-xs px-1.5 py-0.5 rounded transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {getCountByStatus(status)}
              </span>
            </Button>
          );
        })}
      </div>
      
      {loading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-busy="true">
          {Array.from({ length: 8 }).map((_,i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="aspect-[2/3] w-full rounded-md bg-muted/30" />
              <div className="h-4 w-3/4 bg-muted/30 rounded" />
              <div className="h-3 w-1/2 bg-muted/20 rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Você ainda não adicionou livros. Abra um título e escolha um status.</p>
      ) : mine.length === 0 ? (
        <p className="text-muted-foreground">Nenhum livro encontrado nesta categoria.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {mine.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
};

export default Library;
