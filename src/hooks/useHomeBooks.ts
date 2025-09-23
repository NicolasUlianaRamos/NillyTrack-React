import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/utils/api';

export interface HomeApiBook {
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
  category: string;
}

export interface UnifiedBook {
  id: string;
  type: 'book';
  title: string;
  author: string;
  cover: string;
  description: string;
  rating: number;
  ratingsCount: number;
  buyUrl: string;
  tags?: string[];
  _raw?: HomeApiBook; // debug/reference
}

interface HomeBooksState {
  categories: Record<string, UnifiedBook[]>;
  requested: string[];
  limitPer: number;
  cacheStatus?: string;
  loading: boolean;
  error?: string;
  refresh: () => void;
  lastUpdated?: number;
}

const mapBook = (b: HomeApiBook): UnifiedBook => ({
  id: b.id,
  type: 'book',
  title: b.title || 'Sem título',
  author: b.authors?.[0] || 'Autor desconhecido',
  cover: b.cover || '/placeholder.svg',
  description: '',
  rating: b.averageRating,
  ratingsCount: b.reviewCount,
  buyUrl: '#',
  tags: b.subjects,
  _raw: b,
});

export const useHomeBooks = (): HomeBooksState => {
  const [categories, setCategories] = useState<Record<string, UnifiedBook[]>>({});
  const [requested, setRequested] = useState<string[]>([]);
  const [limitPer, setLimitPer] = useState<number>(0);
  const [cacheStatus, setCacheStatus] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | undefined>();

  const load = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(undefined);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const params = force ? { force: '1' } : undefined;
      const { data } = await api.get('/books/home', { signal: controller.signal, params });
      const cats: Record<string, UnifiedBook[]> = {};
      (Object.entries(data.categories || {}) as [string, HomeApiBook[]][]).forEach(([cat, arr]) => {
        cats[cat] = arr.map(mapBook);
      });
      setCategories(cats);
      const meta = data.meta || {};
      setRequested(meta.requested || Object.keys(cats));
      setLimitPer(meta.limitPer || 0);
      setCacheStatus(meta.cache);
      setLastUpdated(Date.now());
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return; // silent cancel
      setError(err?.response?.data?.message || err.message || 'Erro ao carregar livros.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); return () => abortRef.current?.abort(); }, [load]);

  return { categories, requested, limitPer, cacheStatus, loading, error, refresh: () => load(true), lastUpdated };
};
