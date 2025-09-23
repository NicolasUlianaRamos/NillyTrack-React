import { useCallback, useEffect, useState } from 'react';
import api from '@/utils/api';

export interface ReviewCommentUser { _id?: string; name?: string; premiumUntil?: string; avatarUrl?: string; }
export interface ReviewComment {
  _id: string;
  review: string;
  user: ReviewCommentUser | null;
  text: string;
  createdAt: string;
  isPremiumUser?: boolean;
}
interface ApiResponse { comments: ReviewComment[]; total: number; page: number; limit: number; }

export function useReviewComments(reviewId: string | undefined, initialLimit = 5) {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const fetchPage = useCallback(async (targetPage: number) => {
    if (!reviewId) return;
    setLoading(true); setError(null);
    try {
      const { data } = await api.get<ApiResponse>('/review-comments', { params: { reviewId, page: targetPage, limit } });
      if (targetPage === 1) {
        setComments(data.comments || []);
      } else {
        setComments(prev => [...prev, ...(data.comments || [])]);
      }
      setTotal(data.total || 0);
      setPage(targetPage);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha ao carregar comentários.');
    } finally { setLoading(false); }
  }, [reviewId, limit]);

  useEffect(() => { setComments([]); setPage(1); setTotal(0); if (reviewId) fetchPage(1); }, [reviewId, fetchPage]);

  const hasMore = comments.length < total;

  const loadMore = () => { if (!loading && hasMore) fetchPage(page + 1); };

  const create = async (text: string) => {
    if (!reviewId || !text.trim()) return;
    setPosting(true); setError(null);
    try {
      const { data } = await api.post('/review-comments', { reviewId, text: text.trim() });
      // prepend new comment
      if (data.comment) setComments(prev => [data.comment, ...prev]);
      // increment total
      setTotal(t => t + 1);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao enviar comentário.';
      setError(msg);
      throw new Error(msg);
    } finally { setPosting(false); }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/review-comments/${id}`);
      setComments(prev => prev.filter(c => c._id !== id));
      setTotal(t => Math.max(0, t - 1));
    } catch (err) {
      // silencioso
    }
  };

  return { comments, loading, error, posting, page, total, hasMore, loadMore, create, remove };
}

export default useReviewComments;
