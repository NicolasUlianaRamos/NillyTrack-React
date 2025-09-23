import { useEffect, useMemo, useState, useCallback } from "react";
import api from "@/utils/api";
import useAuth from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

// Frontend statuses mapped to backend
export type LibraryStatus = "lendo" | "lido" | "quero-ler";

export interface LibraryItem {
  id: string;          // frontend book id (maps to backend bookId)
  title: string;
  author?: string;
  cover?: string;      // não persistido no backend atualmente
  type?: string;       // 'book' etc (frontend)
  status: LibraryStatus;
  backendId?: string;  // Mongo _id
  averageRating?: number;
  reviewCount?: number;
}

// Map frontend status -> backend status values
const statusMapToBackend: Record<LibraryStatus, string> = {
  "quero-ler": "to-read",
  "lendo": "reading",
  "lido": "read",
};
// Reverse map for hydration
const statusMapFromBackend: Record<string, LibraryStatus | undefined> = {
  "to-read": "quero-ler",
  "reading": "lendo",
  "read": "lido",
};

interface BackendLibraryItem {
  _id: string;
  bookId: string;
  title: string;
  author?: string;
  status: string;
  averageRating?: number;
  reviewCount?: number;
  book?: {
    id: string;
    title?: string | null;
    authors?: string[];
    cover?: string | null;
    averageRating?: number;
    reviewCount?: number;
  };
}

export function useLibrary(params?: { adminUserId?: string }) {
  const { authenticated, user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback((backendItems: BackendLibraryItem[]) => {
    setItems(
      backendItems
        .map((b) => {
          const mapped = statusMapFromBackend[b.status];
          if (!mapped) return null;
          const bookData: BackendLibraryItem['book'] | undefined = b.book;
          const finalTitle = b.title || bookData?.title || 'Título';
          const finalAuthor = b.author || bookData?.authors?.[0] || undefined;
          const cover = bookData?.cover || undefined;
          const averageRating = b.averageRating ?? bookData?.averageRating;
          const reviewCount = b.reviewCount ?? bookData?.reviewCount;
          return { id: b.bookId, title: finalTitle, author: finalAuthor, cover, status: mapped, backendId: b._id, type: 'book', averageRating, reviewCount } as LibraryItem;
        })
        .filter(Boolean) as LibraryItem[]
    );
  }, []);

  const fetchAll = useCallback(async () => {
    if (!authenticated) { setItems([]); return; }
    setLoading(true); setError(null);
    try {
      // Admin pode ver itens de outro usuário usando rota dedicada
      let url = '/library-items';
      if (params?.adminUserId && (user as any)?.role === 'admin') {
        url = `/library-items/admin/${params.adminUserId}`;
      }
      const { data } = await api.get(url);
      hydrate((data.items || []) as BackendLibraryItem[]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha ao carregar biblioteca.');
    } finally { setLoading(false); }
  }, [hydrate, authenticated, params?.adminUserId, user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const map = useMemo(() => new Map(items.map((i) => [i.id, i.status])), [items]);

  const setStatus = useCallback(async (bookId: string, status: LibraryStatus, meta?: { title?: string; author?: string; cover?: string; type?: string }) => {
    if (!authenticated) {
  toast({ title: 'Login necessário', description: 'Entre para gerenciar sua biblioteca.', variant: 'warning' });
      return;
    }
    // Otimista: atualiza local antes
    setItems((prev) => {
      const next = prev.filter(i => i.id !== bookId);
  next.push({ id: bookId, title: meta?.title || 'Título', author: meta?.author, cover: meta?.cover, type: meta?.type, status });
      return next;
    });
    try {
      const backendStatus = statusMapToBackend[status];
      // Verifica se já existe item => atualiza? Backend ainda não possui rota update, então tentamos criar e se 409 ignoramos
      const existing = items.find(i => i.id === bookId);
      if (existing?.backendId) {
        await api.patch(`/library-items/${existing.backendId}`, { status: backendStatus });
        fetchAll();
      } else {
        await api.post('/library-items', { bookId, title: meta?.title || 'Título', author: meta?.author, cover: meta?.cover, mediaType: meta?.type, status: backendStatus });
        fetchAll(); // re-sync para pegar _id
      }
    } catch (err: any) {
  toast({ title: 'Erro', description: err?.response?.data?.message || 'Falha ao salvar item.', variant: 'destructive' });
      fetchAll(); // reverte
    }
  }, [items, fetchAll, authenticated]);

  const remove = useCallback(async (bookId: string) => {
    if (!authenticated) return;
    const target = items.find(i => i.id === bookId);
    setItems(prev => prev.filter(i => i.id !== bookId));
    try {
  if (target?.backendId) await api.delete(`/library-items/${target.backendId}`);
    } catch (err: any) {
  toast({ title: 'Erro', description: err?.response?.data?.message || 'Falha ao remover item.', variant: 'destructive' });
      fetchAll();
    }
  }, [items, fetchAll, authenticated]);

  return { items, map, setStatus, remove, reload: fetchAll, loading, error };
}
