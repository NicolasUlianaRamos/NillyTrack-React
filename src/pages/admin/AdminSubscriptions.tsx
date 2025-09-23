import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { User, CreditCard, Search, ArrowLeft, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/utils/api";

type SubStatus = 'active' | 'pending' | 'authorized' | 'cancelled' | 'paused' | 'expired' | 'stopped' | 'finished';
type PlanType = 'premium' | 'free';

interface SubRow {
  _id: string;
  user: { _id: string; name?: string; email?: string } | string;
  planType: PlanType;
  status: SubStatus;
  amount?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  mp_subscription_id?: string;
}

const AdminSubscriptions = () => {
  const [sp, setSp] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const statusParam = (sp.get('status') || 'all') as 'all' | SubStatus;
  const planParam = (sp.get('plan') || 'all') as 'all' | PlanType;
  const emailParam = (sp.get('email') || '').trim();
  const pageParam = Math.max(parseInt(sp.get('page') || '1', 10), 1);
  const limitParam = Math.min(Math.max(parseInt(sp.get('limit') || '10', 10), 1), 100);
  const [searchTerm, setSearchTerm] = useState(emailParam); // email parcial
  const [status, setStatus] = useState<'all' | SubStatus>(statusParam);
  const [plan, setPlan] = useState<'all' | PlanType>(planParam);
  const [page, setPage] = useState(pageParam);
  const [limit] = useState(limitParam);
  const [rows, setRows] = useState<SubRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL sync
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set('page', String(page));
    next.set('limit', String(limit));
    if (status && status !== 'all') next.set('status', status); else next.delete('status');
    if (plan && plan !== 'all') next.set('plan', plan); else next.delete('plan');
    if (searchTerm) next.set('email', searchTerm); else next.delete('email');
    navigate(`${pathname}?${next.toString()}`, { replace: true });
  }, [page, limit, status, plan, searchTerm]);

  // react to URL changes
  useEffect(() => {
    const s = (sp.get('status') || 'all') as any;
    const p = (sp.get('plan') || 'all') as any;
    const e = (sp.get('email') || '').trim();
    const pg = Math.max(parseInt(sp.get('page') || '1', 10), 1);
    const lm = Math.min(Math.max(parseInt(sp.get('limit') || '10', 10), 1), 100);
    if (s !== status) setStatus(s);
    if (p !== plan) setPlan(p);
    if (e !== searchTerm) setSearchTerm(e);
    if (pg !== page) setPage(pg);
  }, [sp]);

  useEffect(() => {
    let ignore = false;
    const fetchSubs = async () => {
      setLoading(true); setError(null);
      try {
        const params: any = { page, limit };
        if (status !== 'all') params.status = status;
        if (plan !== 'all') params.planType = plan;
        if (searchTerm.trim()) params.userEmail = searchTerm.trim();
  const { data } = await api.get('/subscription', { params });
        if (ignore) return;
        setRows(data.subscriptions || []);
        setTotal(data.total || 0);
      } catch (e: any) {
        if (ignore) return;
        setError(e?.response?.data?.message || 'Erro ao carregar assinaturas.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchSubs();
    return () => { ignore = true; };
  }, [page, limit, status, plan, searchTerm]);

  const getPlanBadge = (p: PlanType) => {
    const label = p === 'premium' ? 'Premium' : 'Free';
    const variant = p === 'premium' ? 'default' : 'outline';
    return <Badge variant={variant as any}>{label}</Badge>;
  };

  const getStatusBadge = (s: SubStatus) => {
    const variant: any = ({
      active: 'default',
      pending: 'secondary',
      authorized: 'secondary',
      cancelled: 'destructive',
      paused: 'secondary',
      expired: 'outline',
      stopped: 'outline',
      finished: 'outline'
    } as Record<SubStatus, string>)[s] || 'outline';
    const label = ({
      active: 'Ativa', pending: 'Pendente', authorized: 'Autorizada', cancelled: 'Cancelada',
      paused: 'Pausada', expired: 'Expirada', stopped: 'Interrompida', finished: 'Concluída'
    } as Record<SubStatus, string>)[s] || s;
    return <Badge variant={variant}>{label}</Badge>;
  };
  const currencyFormat = (amount?: number, currency?: string) => {
    if (typeof amount !== 'number') return '—';
    try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: (currency || 'BRL') as any }).format(amount); } catch { return `${amount} ${currency || ''}`; }
  };

  const cancelSub = async (id: string) => {
    try {
      await api.patch(`/subscription/${id}/cancel`);
      // Reload current page
      const { data } = await api.get('/subscription', { params: { page, limit, status: status==='all'?undefined:status, planType: plan==='all'?undefined:plan, userEmail: searchTerm||undefined } });
      setRows(data.subscriptions || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Falha ao cancelar.');
    }
  };

  return (
    <main className="container py-8">
      <Helmet>
        <title>Gerenciar Assinaturas — Admin Dashboard</title>
        <meta name="description" content="Gerencie todas as assinaturas da plataforma." />
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
            <h1 className="text-3xl font-bold">Gerenciar Assinaturas</h1>
            <p className="text-muted-foreground">Total de {total} assinaturas</p>
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
              placeholder="Buscar por e-mail..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="max-w-xs"
            />
            <Select value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="authorized">Autorizada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
                <SelectItem value="stopped">Interrompida</SelectItem>
                <SelectItem value="finished">Concluída</SelectItem>
              </SelectContent>
            </Select>
            <Select value={plan} onValueChange={(v) => { setPlan(v as any); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Plano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Assinaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
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
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">Nenhuma assinatura encontrada.</TableCell></TableRow>
                )}
                {!loading && !error && rows.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" alt={(typeof s.user === 'object' ? s.user.name : 'Usuário') || 'Usuário'} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{typeof s.user === 'object' ? (s.user.name || 'Usuário') : 'Usuário'}</p>
                          <p className="text-sm text-muted-foreground">{typeof s.user === 'object' ? (s.user.email || '') : ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getPlanBadge(s.planType)}</TableCell>
                    <TableCell>{getStatusBadge(s.status)}</TableCell>
                    <TableCell>{currencyFormat(s.amount, s.currency)}</TableCell>
                    <TableCell>{s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {s.status !== 'cancelled' && (
                          <Button size="sm" variant="outline" onClick={() => cancelSub(s._id)}>
                            <Trash2 className="h-4 w-4 mr-1" /> Cancelar
                          </Button>
                        )}
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
      </div>
    </main>
  );
};

export default AdminSubscriptions;