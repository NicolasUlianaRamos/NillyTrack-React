import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/utils/api';

export interface CategoryApiBook {
  id: string;
  title: string | null;
  authors: string[];
  year: number | null;
  cover: string | null;
  subjects: string[];
  reviewCount: number;
  averageRating: number;
  isbn10: string[];
  isbn10Source: string;
}

export interface CategoryBooksState {
  items: CategoryApiBook[];
  loading: boolean;
  error?: string;
  page: number;
  setPage: (p:number)=>void;
  limit: number;
  meta?: { total: number; count: number; category: string };
}

export const useCategoryBooks = (category: string, initialPage = 1, limit = 20): CategoryBooksState => {
  const [items, setItems] = useState<CategoryApiBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [page, setPage] = useState(initialPage);
  const [meta, setMeta] = useState<any>();
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(async (cat: string, p: number) => {
    if (!cat) { setItems([]); return; }
    try {
      setLoading(true); setError(undefined);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const { data } = await api.get('/books/category', { params: { category: cat, page: p, limit }, signal: controller.signal });
      setItems(data.items || []);
      setMeta({ total: data.total || 0, count: data.count || 0, category: data.category });
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      setError(err?.response?.data?.message || err.message || 'Erro ao carregar categoria.');
    } finally { setLoading(false); }
  }, [limit]);

  // Sync internal page with external initialPage when category or URL-derived page changes
  useEffect(() => {
    setPage(initialPage);
  }, [category, initialPage]);

  useEffect(() => { if (category) fetchPage(category, page); return () => abortRef.current?.abort(); }, [category, page, fetchPage]);

  return { items, loading, error, page, setPage, limit, meta };
};
