import { Helmet } from "react-helmet-async";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ArrowLeft } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';
import { toast } from '@/hooks/use-toast';

const EditProfile = () => {
  const { userId } = useParams(); // rota /perfil/editar/:userId
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading, authenticated, refreshSelf } = useAuth();
  const [user, setUser] = useState({
    name: "",
    email: "",
    bio: "",
    avatarUrl: ""
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Removido highlight visual inline; usaremos apenas toasts

  const isOwn = !userId || (authUser?._id === userId);
  const backToProfile = () => {
    const target = `/perfil/${authUser?._id || userId || ''}`.replace(/\/$/, '');
    if (typeof window !== 'undefined' && window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(target);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!authenticated) {
      navigate('/login');
      return;
    }
    // Só permitir edição do próprio perfil (não admin ainda)
    if (!isOwn) {
      navigate(`/perfil/${userId}`);
      return;
    }
    // Carregar dados atuais
    if (authUser) {
      setUser({
        name: authUser.name || '',
        email: authUser.email || '',
        bio: (authUser as any).bio || '',
        avatarUrl: (authUser as any).avatarUrl || (authUser as any).avatar || ''
      });
    }
  }, [authLoading, authenticated, authUser, isOwn, navigate, userId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      const preview = URL.createObjectURL(f);
      setUser(u => ({ ...u, avatarUrl: preview }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticated) return;
    try {
      setSubmitting(true);
      const form = new FormData();
      if (user.name.trim()) form.append('name', user.name.trim());
      if (user.email.trim()) form.append('email', user.email.trim());
      if (user.bio.trim()) form.append('bio', user.bio.trim());
      if (showPasswordFields && passwords.password) {
        if (passwords.password !== passwords.confirmPassword) {
          toast({ title: 'Erro', description: 'As senhas não conferem.', variant: 'destructive' });
          setSubmitting(false);
          return;
        }
        form.append('password', passwords.password);
        form.append('confirmPassword', passwords.confirmPassword);
      }
      if (file) form.append('image', file);
      const { data } = await api.patch('/users/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast({ title: 'Perfil atualizado', description: 'Suas alterações foram salvas.', variant: 'success' });
      await refreshSelf();
      // Se veio novo avatar real, substitui preview
      if (data?.user) {
        setUser(u => ({ ...u, avatarUrl: data.user.avatarUrl || data.user.avatar || u.avatarUrl }));
      }
    } catch (err: any) {
      const resp = err?.response?.data;
      // express-validator middleware retorna { errors: [ { field: msg }, ... ] }
      const valErrors = resp?.errors;
      if (Array.isArray(valErrors) && valErrors.length) {
        valErrors.slice(0, 5).forEach((obj: any, idx: number) => {
          const field = Object.keys(obj)[0];
          const message = obj[field];
          toast({ title: idx === 0 ? 'Erro de validação' : undefined, description: message, variant: 'destructive' });
        });
      } else {
        const rawMsg = resp?.message;
        const messages: string[] = Array.isArray(rawMsg) ? rawMsg : [rawMsg || 'Falha ao atualizar perfil.'];
        messages.slice(0, 5).forEach((m, idx) => {
          toast({ title: idx === 0 ? 'Erro ao atualizar' : undefined, description: m, variant: 'destructive' });
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container py-8">
      <Helmet>
        <title>Editar Perfil — NillyTrack</title>
        <meta name="description" content="Edite suas informações de perfil." />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" type="button" onClick={backToProfile}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Editar Perfil</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatarUrl || ''} alt={user.name} />
                  <AvatarFallback className="text-2xl">
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()} disabled={submitting}>
                    Alterar Foto
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG até 5MB
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    placeholder="Seu nome completo"
                    disabled={submitting}
                  />

                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    placeholder="seu.email@exemplo.com"
                    disabled={submitting}
                  />

                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={user.bio}
                    onChange={(e) => setUser({ ...user, bio: e.target.value })}
                    placeholder="Conte um pouco sobre você... (Shift+Enter para nova linha)"
                    disabled={submitting}
                    className="resize-y min-h-[120px]"
                  />
                </div>

                {/* Password Section */}
                <div className="space-y-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                  >
                    Desejo alterar a senha
                  </Button>

                  {showPasswordFields && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="password">Nova Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          value={passwords.password}
                          disabled={submitting}
                          onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                          placeholder="Digite sua nova senha"
                        />

                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          disabled={submitting}
                          value={passwords.confirmPassword}
                          onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                          placeholder="Confirme sua nova senha"
                        />

                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? 'Salvando...' : 'Salvar Alterações'}</Button>
                <Button type="button" variant="outline" disabled={submitting} onClick={backToProfile}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default EditProfile;