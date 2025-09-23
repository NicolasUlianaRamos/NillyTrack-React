import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/utils/api';

export interface SearchApiBook {
  id: string;
  title: string | null;
  subtitle: string | null;
  authors: string[];
  year: number | null;
  cover: string | null;
  subjects: string[];
  reviewCount: number;
  averageRating: number;
  isbn10: string[];
  isbn10Source: string;
  isbn13?: string[];
}

export interface SearchResult extends SearchApiBook {}

interface UseSearchBooksOptions {
  debounceMs?: number;
  minLength?: number;
  limit?: number; // itens por página
  initialPage?: number; // página inicial (ex.: vinda da URL)
}

interface UseSearchBooksState {
  items: SearchResult[];
  loading: boolean;
  error?: string;
  q: string;
  page: number;
  hasMore: boolean;
  setPage: (p: number) => void;
  meta?: any;
}

export const useSearchBooks = (
  q: string,
  { debounceMs = 350, minLength = 2, limit = 20, initialPage = 1 }: UseSearchBooksOptions = {}
): UseSearchBooksState => {
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(false);
  const [meta, setMeta] = useState<any>();
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastQRef = useRef<string>('');
  const firstMountRef = useRef<boolean>(true);

  const doFetch = useCallback(async (query: string, p: number) => {
    if (query.length < minLength) {
      setItems([]); setError(undefined); setHasMore(false); setMeta(undefined); return;
    }
    try {
      setLoading(true);
      setError(undefined);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
  const { data } = await api.get('/books/search', { params: { q: query, page: p, limit }, signal: controller.signal });
  const arr: SearchResult[] = (data.items || []) as SearchResult[];
  setItems(arr);
  // API retorna total; hasMore se ainda não atingimos limite * page
  const total: number = data.total || 0;
  const consumed = p * limit;
  setHasMore(consumed < total);
  setMeta({ total, page: data.page, limit: data.limit, count: data.count });
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      setError(err?.response?.data?.message || err.message || 'Erro na busca.');
    } finally {
      setLoading(false);
    }
  }, [minLength]);

  // Reset page when query changes (mas não no primeiro mount, para respeitar initialPage)
  useEffect(() => {
    if (firstMountRef.current) return; // só após o primeiro carregamento
    setPage(1);
  }, [q]);

  // Debounced fetch
  useEffect(() => {
    const query = q.trim();
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (query.length < minLength) { setItems([]); setError(undefined); return; }

    timerRef.current = window.setTimeout(() => {
      // Na primeira montagem, respeitar a página atual (que pode vir da URL)
      if (firstMountRef.current) {
        firstMountRef.current = false;
        lastQRef.current = query;
        doFetch(query, page);
        return;
      }

      // Se a query mudou desde a última busca, buscar página 1; caso contrário, manter página atual
      const changed = lastQRef.current !== query;
      lastQRef.current = query;
      const p = changed ? 1 : page;
      doFetch(query, p);
    }, debounceMs);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [q, page, debounceMs, minLength, doFetch]);

  // Pagination (manual trigger via setPage)
  useEffect(() => {
    const query = q.trim();
    if (page === 1 || query.length < minLength) return;
    doFetch(query, page);
  }, [page, q, minLength, doFetch]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { items, loading, error, q, page, hasMore, setPage, meta };
};
