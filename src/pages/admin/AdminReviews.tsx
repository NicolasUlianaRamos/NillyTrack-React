import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { User, Search, ArrowLeft, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { RatingStars } from "@/components/RatingStars";
import api from "@/utils/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "@/hooks/use-toast";

interface ReviewRow {
  _id: string;
  user?: { _id: string; name?: string; email?: string; avatarUrl?: string } | string;
  itemId: string;
  itemType: string;
  rating: number;
  text?: string;
  createdAt: string;
}

const AdminReviews = () => {
  const [sp, setSp] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const itemIdParam = (sp.get('itemId') || '').trim();
  const typeParam = (sp.get('itemType') || 'all') as 'all' | 'book' | 'movie' | 'series';
  const pageParam = Math.max(parseInt(sp.get('page') || '1', 10), 1);
  const limitParam = Math.min(Math.max(parseInt(sp.get('limit') || '10', 10), 1), 100);
  const [itemId, setItemId] = useState(itemIdParam);
  const [itemType, setItemType] = useState<'all' | 'book' | 'movie' | 'series'>(typeParam);
  const [page, setPage] = useState(pageParam);
  const [limit] = useState(limitParam);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // URL sync
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set('page', String(page));
    next.set('limit', String(limit));
    if (itemId) next.set('itemId', itemId); else next.delete('itemId');
    if (itemType && itemType !== 'all') next.set('itemType', itemType); else next.delete('itemType');
    navigate(`${pathname}?${next.toString()}`, { replace: true });
  }, [page, limit, itemId, itemType]);

  // react to URL changes
  useEffect(() => {
    const iid = (sp.get('itemId') || '').trim();
    const it = (sp.get('itemType') || 'all') as any;
    const pg = Math.max(parseInt(sp.get('page') || '1', 10), 1);
    const lm = Math.min(Math.max(parseInt(sp.get('limit') || '10', 10), 1), 100);
    if (iid !== itemId) setItemId(iid);
    if (it !== itemType) setItemType(it);
    if (pg !== page) setPage(pg);
  }, [sp]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true); setError(null);
  try {
  const params: any = { page, limit };
    if (itemId.trim()) params.itemId = itemId.trim();
    if (itemType !== 'all') params.itemType = itemType;
    const { data } = await api.get('/reviews/admin', { params });
        if (ignore) return;
        setRows(data.reviews || []);
        setTotal(data.total || 0);
      } catch (e: any) {
        if (ignore) return;
        setError(e?.response?.data?.message || 'Erro ao carregar reviews.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [page, limit, itemId, itemType]);

  const confirmDelete = (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDeleteReview = async () => {
    if (!pendingDeleteId) return;
    try {
  await api.delete(`/reviews/admin/${pendingDeleteId}`);
  toast({ title: 'Review excluída', description: 'A review foi removida com sucesso.', variant: 'success' });
      // reload
      const { data } = await api.get('/reviews/admin', { params: { page, limit, itemId: itemId||undefined, itemType: itemType==='all'?undefined:itemType } });
      setRows(data.reviews || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      toast({ title: 'Erro ao excluir', description: e?.response?.data?.message || 'Falha ao excluir review.', variant: 'destructive' as any });
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <main className="container py-8">
      <Helmet>
        <title>Gerenciar Reviews — Admin Dashboard</title>
        <meta name="description" content="Gerencie todas as reviews da plataforma." />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Reviews</h1>
            <p className="text-muted-foreground">Total de {total} reviews</p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Filtrar por Item ID (opcional)"
              value={itemId}
              onChange={(e) => { setItemId(e.target.value); setPage(1); }}
              className="max-w-xs"
            />
            <div className="flex items-center gap-2 text-sm">
              <label className="text-muted-foreground">Tipo:</label>
              <select
                className="border rounded px-3 py-2 bg-background"
                value={itemType}
                onChange={(e) => { setItemType(e.target.value as any); setPage(1); }}
              >
                <option value="all">Todos</option>
                <option value="book">Livro</option>
                <option value="movie">Filme</option>
                <option value="series">Série</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Comentário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">Carregando...</TableCell></TableRow>
                )}
                {error && !loading && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-destructive">{error}</TableCell></TableRow>
                )}
                {!loading && !error && rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">Nenhuma review encontrada.</TableCell></TableRow>
                )}
                {!loading && !error && rows.map((review) => (
                  <TableRow key={review._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={typeof review.user === 'object' ? (review.user.avatarUrl || '') : ''} alt={typeof review.user === 'object' ? (review.user.name || 'Usuário') : 'Usuário'} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{typeof review.user === 'object' ? (review.user.name || 'Usuário') : 'Usuário'}</p>
                          <p className="text-sm text-muted-foreground">{typeof review.user === 'object' ? (review.user.email || '') : ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium max-w-32 truncate">{review.itemId}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <RatingStars value={review.rating} size={16} readOnly />
                        <span className="text-sm">({review.rating})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-48 truncate">{review.text}</p>
                    </TableCell>
                    <TableCell>{new Date(review.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="outline">{review.itemType}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => confirmDelete(review._id)} title="Excluir review">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {Math.ceil(total / limit) > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(Math.max(1, page - 1))}
                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, Math.ceil(total / limit)) }, (_, i) => {
                      const start = Math.max(1, Math.min(page - 2, Math.ceil(total / limit) - 4));
                      const p = start + i;
                      const totalPages = Math.ceil(total / limit);
                      if (p > totalPages) return null;
                      return (
                        <PaginationItem key={p}>
                          <PaginationLink onClick={() => setPage(p)} isActive={page === p} className="cursor-pointer">
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(Math.min(Math.ceil(total / limit), page + 1))}
                        className={page === Math.ceil(total / limit) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Excluir review?"
          description="Esta ação não pode ser desfeita. A review será removida permanentemente."
          onConfirm={handleDeleteReview}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="destructive"
        />
      </div>
    </main>
  );
};

export default AdminReviews;