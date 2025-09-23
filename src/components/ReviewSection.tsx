import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "@/components/RatingStars";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, MessageCircle, User, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import api from "@/utils/api";
import useReviewComments from '@/hooks/useReviewComments';

interface Review { _id: string; user: { _id: string; name: string; premiumUntil?: string; avatarUrl?: string }; itemId: string; itemType: string; rating: number; text?: string; createdAt: string; isPremiumUser?: boolean; }

interface ReviewsResponse { reviews: Review[]; page: number; limit: number; totalPages: number; total: number; }

interface ReviewSectionProps {
  bookId: string;
}

export const ReviewSection = ({ bookId }: ReviewSectionProps) => {
  const { authenticated } = useAuthContext();
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const commentsHook = useReviewComments(expandedComments, 5);

  useEffect(() => {
    let alive = true;
    const fetchReviews = async () => {
      if (!bookId) return;
      setLoading(true); setError(null);
      try {
        const { data } = await api.get<ReviewsResponse>(`/reviews`, { params: { itemId: bookId, itemType: 'book', page, limit } });
        if (!alive) return;
        setReviews(data.reviews || []);
      } catch (err: any) {
        if (!alive) return;
        setError(err?.response?.data?.message || err.message || 'Erro ao carregar reviews.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchReviews();
    return () => { alive = false; };
  }, [bookId, page]);

  const submitReview = async () => {
    if (!authenticated) {
  toast({ title: 'Faça login', description: 'É preciso estar logado para avaliar.', variant: 'warning' });
      return;
    }
    if (!myRating || !myReview.trim()) return;
    try {
      const payload = { itemId: bookId, itemType: 'book', rating: myRating, text: myReview.trim() };
      await api.post('/reviews', payload);
  toast({ title: 'Review enviada!', description: 'Sua avaliação foi publicada com sucesso.', variant: 'success' });
      setMyRating(0); setMyReview('');
      // Recarrega primeira página para incluir nova review (assumindo ordenação por createdAt desc)
      setPage(1);
      // Trigger refetch
      (async () => {
        try {
          const { data } = await api.get<ReviewsResponse>(`/reviews`, { params: { itemId: bookId, itemType: 'book', page: 1, limit } });
          setReviews(data.reviews || []);
        } catch {/* ignore */}
      })();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao enviar review.';
  toast({ title: 'Falha', description: msg, variant: 'destructive' });
    }
  };

  const toggleComments = (reviewId: string) => {
    setExpandedComments(expandedComments === reviewId ? null : reviewId);
  };

  return (
    <div className="space-y-8">
      {/* Write Review */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Escreva sua avaliação</h2>
        <div className="space-y-3 max-w-2xl">
          <RatingStars value={myRating} onChange={setMyRating} size={24} />
          <Textarea 
            value={myReview} 
            onChange={(e) => setMyReview(e.target.value)} 
            placeholder="Conte sua experiência sem spoilers..." 
            rows={4}
          />
          <Button onClick={submitReview} disabled={!myRating || !myReview.trim()}>
            {authenticated ? 'Avaliar' : 'Login para enviar'}
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Reviews da comunidade
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </h3>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !error && reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda sem reviews para este livro.</p>
        )}
        <div className="space-y-4">
          {reviews.map(r => {
            const isExpanded = expandedComments === r._id;
            const { comments, loading: loadingComments, error: errorComments, hasMore, loadMore, create, posting } = isExpanded
              ? commentsHook
              : { comments: [], loading: false, error: null, hasMore: false, loadMore: () => {}, create: async () => {}, posting: false } as any;
            return (
            <Card
              key={r._id}
              className={r.isPremiumUser ? 'relative border-amber-400/70 shadow-[0_0_0_1px_rgba(251,191,36,0.4),0_0_12px_-2px_rgba(251,191,36,0.5)] before:absolute before:inset-0 before:rounded-lg before:pointer-events-none before:border before:border-amber-300/40 before:animate-pulse before:opacity-40' : ''}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    {r.user?.avatarUrl ? (
                      <img src={r.user.avatarUrl} alt={r.user.name} className="object-cover w-full h-full" />
                    ) : (
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium flex flex-wrap items-center gap-2">
                          {r.user?._id ? (
                            <Link
                              to={`/perfil/${r.user._id}`}
                              className="hover:underline focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-sm"
                            >
                              {r.user?.name || 'Usuário'}
                            </Link>
                          ) : (
                            <span>{r.user?.name || 'Usuário'}</span>
                          )}
                          {r.isPremiumUser && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-[0_0_6px_rgba(251,191,36,0.6)] flex-none inline-block">
                              Premium
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <RatingStars value={r.rating} readOnly size={16} />
                    </div>
                    <p className="text-sm leading-relaxed">{r.text || 'Sem texto.'}</p>
                    <div>
                      <Button variant="ghost" size="sm" onClick={() => toggleComments(r._id)}>
                        {expandedComments === r._id ? 'Ocultar comentários' : 'Ver comentários'}
                      </Button>
                    </div>
                    {expandedComments === r._id && (
                      <div className="space-y-3 border-t pt-4">
                        {loadingComments && <p className="text-xs text-muted-foreground">Carregando comentários...</p>}
                        {errorComments && <p className="text-xs text-destructive">{errorComments}</p>}
                        {!loadingComments && comments.length === 0 && <p className="text-xs text-muted-foreground">Sem comentários ainda.</p>}
                        {comments.map(c => (
                          <div key={c._id} className="flex gap-2 text-xs items-start">
                            <Avatar className="h-6 w-6">
                              {c.user?.avatarUrl ? (
                                <img src={c.user.avatarUrl} alt={c.user.name} className="object-cover w-full h-full" />
                              ) : (
                                <AvatarFallback>{(c.user?.name?.[0] || 'U').toUpperCase()}</AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-medium truncate max-w-[120px]">{c.user?.name || 'Usuário'}</span>
                                {c.isPremiumUser && <span className="text-amber-400 text-[10px]">★</span>}
                                <span className="text-[10px] text-muted-foreground ml-auto">{new Date(c.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs leading-snug break-words">{c.text}</p>
                            </div>
                          </div>
                        ))}
                        {hasMore && !loadingComments && (
                          <Button variant="outline" size="sm" onClick={loadMore}>Mais</Button>
                        )}
                        {authenticated && (
                          <div className="space-y-2">
                            <Textarea
                              value={newComment}
                              onChange={e => setNewComment(e.target.value)}
                              placeholder="Escrever comentário..."
                              rows={2}
                              className="text-xs"
                            />
                            <Button
                              size="sm"
                              disabled={posting || !newComment.trim()}
                              onClick={async () => {
                                try {
                                  await create(newComment);
                                  setNewComment('');
                                  toast({ title: 'Comentado', description: 'Comentário publicado.', variant: 'success' });
                                } catch (e: any) {
                                  toast({ title: 'Erro', description: e.message || 'Falha ao comentar.', variant: 'destructive' });
                                }
                              }}
                            >
                              {posting ? 'Enviando...' : 'Comentar'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );})}
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" size="sm" disabled={page===1 || loading} onClick={() => setPage(p=> Math.max(1,p-1))}>Anterior</Button>
            <span className="text-xs text-muted-foreground">Página {page}</span>
            <Button variant="outline" size="sm" disabled={reviews.length < limit || loading} onClick={() => setPage(p=> p+1)}>Próxima</Button>
          </div>
        )}
      </div>
    </div>
  );
};