import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { User, Library, Edit, Search, ArrowLeft, Save } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/utils/api";
import { toast } from "@/hooks/use-toast";

interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  premiumUntil?: string;
  avatarUrl?: string | null;
  createdAt: string;
  role: 'user' | 'admin';
  bio?: string | null;
}

const AdminUsers = () => {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const qParam = (sp.get('q') || '').trim();
  const pageParam = Math.max(parseInt(sp.get('page') || '1', 10), 1);
  const [searchTerm, setSearchTerm] = useState(qParam);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null
  });
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: 'user'|'admin'; premiumDate: string; bio: string; password: string; }>(
    { name: '', email: '', role: 'user', premiumDate: '', bio: '', password: '' }
  );
  const usersPerPage = 10;

  // keep URL in sync (visible 'page' param)
  useEffect(() => {
    const next = new URLSearchParams(sp);
    if (searchTerm) next.set('q', searchTerm); else next.delete('q');
    next.set('page', String(currentPage));
    next.set('limit', String(usersPerPage));
    navigate(`${pathname}?${next.toString()}`, { replace: true });
  }, [searchTerm, currentPage, usersPerPage]);

  // react to URL changes (external nav)
  useEffect(() => {
    const qp = (sp.get('q') || '').trim();
    const pp = Math.max(parseInt(sp.get('page') || '1', 10), 1);
    if (qp !== searchTerm) setSearchTerm(qp);
    if (pp !== currentPage) setCurrentPage(pp);
  }, [sp]);

  useEffect(() => {
    let ignore = false;
    const fetchUsers = async () => {
      setLoading(true); setError(null);
      try {
        const params: any = { page: currentPage, limit: usersPerPage };
        if (searchTerm.trim()) params.q = searchTerm.trim();
        const { data } = await api.get('/users/admin', { params });
        if (ignore) return;
        const rows: AdminUserRow[] = (data.users || []).map((u: any) => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          premiumUntil: u.premiumUntil,
          avatarUrl: u.avatarUrl,
          createdAt: u.createdAt,
          role: u.role,
          bio: u.bio,
        }));
        setUsers(rows);
        setTotal(data.total || 0);
      } catch (e: any) {
        if (ignore) return;
        setError(e?.response?.data?.message || 'Erro ao carregar usuários.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchUsers();
    return () => { ignore = true; };
  }, [currentPage, searchTerm]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / usersPerPage)), [total, usersPerPage]);
  const currentUsers = users;

  const getSubscriptionBadge = (u: AdminUserRow) => {
    const isPremium = u.premiumUntil && new Date(u.premiumUntil) > new Date();
    const label = isPremium ? 'Premium' : 'Free';
    const variant = isPremium ? 'default' : 'outline' as const;
    return <Badge variant={variant}>{label}</Badge>;
  };
  
  const toDateInput = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const openEdit = (u: AdminUserRow) => {
    setEditUser(u);
    setForm({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'user',
      premiumDate: toDateInput(u.premiumUntil),
      bio: u.bio || '',
      password: ''
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editUser) return;
    try {
      setSaving(true);
      const updates: any = {
        name: form.name?.trim(),
        email: form.email?.trim(),
        role: form.role,
        bio: form.bio?.trim() || undefined,
      };
      // premiumUntil: vazio => remover; preenchido => setar fim do dia
      if (form.premiumDate === '') {
        updates.premiumUntil = null; // remove premium
      } else {
        // usa 23:59:59 local para evitar expirar no início do dia
        const end = new Date(form.premiumDate + 'T23:59:59');
        updates.premiumUntil = end.toISOString();
      }
      if (form.password && form.password.length < 6) {
        toast({ title: 'Senha muito curta', description: 'Mínimo de 6 caracteres.', variant: 'destructive' });
        return;
      }
      if (form.password) updates.password = form.password;

      const { data } = await api.patch(`/users/admin/${editUser._id}`, updates);
      const updated = data?.user;
      if (updated) {
        setUsers(prev => prev.map(u => u._id === editUser._id ? {
          _id: updated._id,
          name: updated.name,
          email: updated.email,
          premiumUntil: updated.premiumUntil,
          avatarUrl: updated.avatarUrl,
          createdAt: updated.createdAt,
          role: updated.role,
          bio: updated.bio,
        } : u));
      }
      toast({ title: 'Usuário atualizado', description: 'Alterações salvas com sucesso.', variant: 'success' });
      setEditOpen(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message || 'Falha ao atualizar usuário.';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };
  // Sem campo de status no backend; se precisar, criar no backend futuramente

  return (
    <main className="container py-8">
      <Helmet>
        <title>Gerenciar Usuários — Admin Dashboard</title>
        <meta name="description" content="Gerencie todos os usuários da plataforma." />
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
            <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
            <p className="text-muted-foreground">Total de {total} usuários</p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assinatura</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Carregando...</TableCell>
                  </TableRow>
                )}
                {error && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-destructive">{error}</TableCell>
                  </TableRow>
                )}
                {!loading && !error && currentUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Nenhum usuário encontrado nesta página.</TableCell>
                  </TableRow>
                )}
                {!loading && !error && currentUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl || ''} alt={user.name} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getSubscriptionBadge(user)}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/biblioteca?userId=${user._id}`}>
                            <Library className="h-4 w-4 mr-1" />
                            Biblioteca
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                      const page = start + i;
                      if (page > totalPages) return null;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>Atualize os dados do usuário. Deixe o campo de senha vazio para não alterar.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Nome</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Função (role)</label>
                <Select value={form.role} onValueChange={(v: 'user'|'admin') => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Premium até</label>
                <Input type="date" value={form.premiumDate} onChange={e => setForm(f => ({ ...f, premiumDate: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Deixe vazio para remover o premium.</p>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Bio</label>
                <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} maxLength={300} />
                <p className="text-xs text-muted-foreground">Até 300 caracteres.</p>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Senha (opcional)</label>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Deixe em branco para não alterar" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={submitEdit} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
};

export default AdminUsers;