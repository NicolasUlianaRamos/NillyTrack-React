import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/RatingStars";
import { ReviewSection } from "@/components/ReviewSection";
import { useState, useEffect } from "react";
import { useLibrary } from "@/hooks/useLibrary";
import { toast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import api from "@/utils/api";

interface ApiBookDetails {
  id: string;
  title: string | null;
  displayTitle?: string | null;
  description: string | null;
  subjects: string[];
  authors: string[];
  cover: string | null;
  year: number | null;
  reviewCount: number;
  averageRating: number;
  isbn10: string[];
  isbn10Source: string;
  isbn13?: string[];
  publicDomain?: boolean;
  readUrl?: string | null;
  downloadPdfUrl?: string | null;
  downloadEpubUrl?: string | null;
}

const BookDetails = () => {
  const { id } = useParams();
  const { setStatus } = useLibrary();
  const [myRating, setMyRating] = useState(0);
  const [review, setReview] = useState("");
  const [book, setBook] = useState<ApiBookDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [searchingByTitle, setSearchingByTitle] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true); setError(null); setBook(null);
    api.get(`/books/${id}`)
      .then(({ data }) => { if (alive) setBook(data); })
      .catch(err => { if (alive) setError(err?.response?.data?.message || err.message || 'Erro ao carregar livro.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <main className="container py-10" aria-busy="true">
        <div className="h-6 w-56 bg-muted/30 rounded animate-pulse mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex justify-center md:justify-start">
            <div className="w-48 sm:w-56 md:w-64 lg:w-72 aspect-[2/3] bg-muted/20 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-4 w-full bg-muted/20 rounded animate-pulse" />))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className="container py-10">
        <h1 className="text-2xl font-bold">{error ? 'Erro' : 'Livro não encontrado'}</h1>
        <p className="text-muted-foreground mt-2">{error || 'Talvez ele tenha sido removido ou o link está incorreto.'}</p>
        <Button asChild className="mt-6"><Link to="/">Voltar à página inicial</Link></Button>
      </main>
    );
  }

  const submitReview = () => {
    toast({ title: "Review enviada!", description: "Funcionalidade de exemplo no frontend.", variant: 'success' });
    setMyRating(0);
    setReview("");
  };

  const handleBuy = async () => {
    if (!book) return;
    // Delegar a validação de país/tipo ao backend; aqui enviamos o primeiro ISBN-10 disponível
    const list = Array.isArray(book.isbn10) ? book.isbn10 : [];
    const chosen = list[0];
    try {
      setBuying(true);
      if (!chosen) {
        toast({ title: 'Indisponível', description: 'Este livro não possui ISBN-10 para compra.', variant: 'info' });
        return;
      }
      const { data } = await api.get('/books/buy', { params: { isbn: chosen } });
      const url: string | undefined = data?.affiliateUrl;
      if (url) {
        window.location.href = url; // redireciona para a página da Amazon com tag de afiliado
      } else {
        toast({ title: 'Erro', description: 'Link de compra não retornado.', variant: 'destructive' });
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Falha ao gerar link de compra.';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    } finally {
      setBuying(false);
    }
  };

  const handleBuyByTitle = async () => {
    if (!book) return;
    try {
      setSearchingByTitle(true);
      const title = book.displayTitle || book.title || '';
      const author = (book.authors || [])[0] || '';
      if (!title) {
        toast({ title: 'Indisponível', description: 'Sem título para pesquisar.', variant: 'info' });
        return;
      }
      const { data } = await api.get('/books/buy-by-title', { params: { title, author } });
      const url: string | undefined = data?.affiliateUrl;
      if (url) {
        window.location.href = url;
      } else {
        toast({ title: 'Erro', description: 'Link de busca não retornado.', variant: 'destructive' });
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Falha ao gerar link de busca.';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    } finally {
      setSearchingByTitle(false);
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.displayTitle || book.title,
    author: (book.authors || []).map(a => ({ "@type": "Person", name: a })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: book.averageRating,
      reviewCount: book.reviewCount,
    },
  };

  return (
    <main className="">
      <Helmet>
        <title>{`${book.displayTitle || book.title} — Detalhes do livro | NillyTrack`}</title>
        <meta name="description" content={`Leia sobre ${(book.displayTitle || book.title) ?? 'Livro'} de ${(book.authors || []).join(', ')}, avaliações e mais.`} />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <section className="container grid md:grid-cols-2 gap-8 py-10">
        <div className="flex justify-center md:justify-start">
          {book.cover ? (
            <div className="w-56 sm:w-64 md:w-72 lg:w-80 xl:w-96 aspect-[2/3] rounded-md shadow-soft overflow-hidden bg-muted/10 flex items-center justify-center">
              <img
                src={book.cover}
                alt={`Capa do livro ${book.displayTitle || book.title}`}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-56 sm:w-64 md:w-72 lg:w-80 xl:w-96 aspect-[2/3] bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">Sem capa</div>
          )}
        </div>
        <article className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">{book.displayTitle || book.title}</h1>
          <p className="text-muted-foreground">{(book.authors || []).join(', ') || 'Autor desconhecido'}</p>
          <div className="flex items-center gap-3">
            <RatingStars value={book.averageRating} readOnly />
            <span className="text-sm text-muted-foreground">({book.reviewCount})</span>
          </div>
          <p className="text-base leading-relaxed whitespace-pre-line">{book.description || 'Sem descrição disponível.'}</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Select onValueChange={(v) => {
              const val = v as any;
              setStatus(book.id, val, { title: book.displayTitle || book.title || 'Título', author: (book.authors || [])[0], cover: book.cover || '', type: 'book' });
              const labelMap: Record<string, string> = { 'lendo': 'Marcado como lendo', 'lido': 'Marcado como lido', 'quero-ler': 'Adicionado como quero ler' };
              toast({ title: 'Biblioteca', description: labelMap[val] || 'Status atualizado.', variant: 'success' });
            }}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Adicionar à biblioteca" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lendo">Lendo</SelectItem>
                <SelectItem value="lido">Lido</SelectItem>
                <SelectItem value="quero-ler">Quero ler</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="default" onClick={handleBuy} disabled={buying || !(Array.isArray(book.isbn10) && book.isbn10.length > 0)} title={!(Array.isArray(book.isbn10) && book.isbn10.length > 0) ? 'Sem ISBN-10 disponível' : undefined}>Comprar livro</Button>
            <div className="text-sm text-muted-foreground">ou</div>
            <Button variant="secondary" onClick={handleBuyByTitle} disabled={searchingByTitle}>
              Livro não encontrado? Tente por aqui
            </Button>
          </div>
        </article>
      </section>

      <section className="container py-10">
        <ReviewSection bookId={book.id} />
      </section>
    </main>
  );
};

export default BookDetails;
