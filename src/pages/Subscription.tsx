import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Crown, Star } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import api from '@/utils/api';
import useAuth from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const Subscription = () => {
  const [email, setEmail] = useState("");
  const planType: 'premium' = 'premium';
  const [loading, setLoading] = useState(false);
  const { authenticated, user } = useAuth();
  const [subLoading, setSubLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(false);

  // Buscar assinatura atual
  const fetchSub = useCallback(async () => {
    if (!authenticated) { setSubscription(null); setFetchError(null); return; }
    setSubLoading(true); setFetchError(null);
    try {
  const { data } = await api.get('/subscription/me');
      setSubscription(data?.subscription || null);
      if (!data?.subscription) setFetchError('Nenhuma assinatura ativa.');
    } catch (err: any) {
      const code = err?.response?.status;
      if (code === 404) {
        // Se não há registro mas usuário tem premiumUntil válido, criar assinatura sintética
        if (user?.premiumUntil && new Date(user.premiumUntil) > new Date()) {
          // Assinatura "legado": sabemos apenas a data de expiração (premiumUntil)
          setSubscription({
            _id: 'legacy-premium',
            status: 'active',
            planType: 'premium',
            endDate: user.premiumUntil, // usar como expiração
            legacy: true
          });
          setFetchError(null);
        } else {
          setSubscription(null);
          setFetchError('Nenhuma assinatura ativa.');
        }
      } else {
        setFetchError(err?.response?.data?.message || 'Erro ao buscar assinatura.');
      }
    } finally { setSubLoading(false); }
  }, [authenticated, user?.premiumUntil]);

  useEffect(() => {
    let alive = true;
    fetchSub();
    return () => { alive = false; };
  }, [authenticated, fetchSub]);

  const handleCheckout = useCallback(async () => {
    if (!authenticated) {
      toast({ title: 'Login necessário', description: 'Entre para assinar o plano premium.', variant: 'warning' });
      return;
    }
  if (subscription && ['active','pending','authorized'].includes(subscription.status)) {
      toast({ title: 'Já possui assinatura', description: 'Cancele a atual antes de iniciar outra.', variant: 'info' });
      return;
    }
    if (!email.trim()) {
      toast({ title: 'Email obrigatório', description: 'Informe o email para cobrança.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
  const { data } = await api.post('/subscription', { planType, emailPay: email.trim() });
      if (data?.init_point) {
        toast({ title: 'Redirecionando…', description: 'Abrindo página segura de pagamento.', variant: 'info' });
        window.location.href = data.init_point;
        return;
      }
      toast({ title: 'Resposta inesperada', description: 'Não veio a URL de pagamento.', variant: 'destructive' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Falha ao iniciar assinatura.';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [authenticated, email, planType]);

  const plan = {
    price: "R$ 9,99",
    period: "/mês"
  };

  const features = [
    "Sem anúncios",
    "Avaliações Destacadas",
    "Comentários Destacados",
    "+ Limite de caracteres por avaliação",
    "Badge Premium no perfil",
    "Suporte prioritário",
    "Acesso antecipado a novos recursos",
    "Selo Premium"
  ];

  return (
    <main className="container py-8">
      <Helmet>
        <title>Assinatura Premium — NillyTrack</title>
        <meta name="description" content="Assine o plano Premium e tenha acesso a recursos exclusivos." />
      </Helmet>

      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Crown className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Premium</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Eleve sua experiência de leitura com recursos exclusivos e acesso ilimitado
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
          {/* Plan Selection / Estado da assinatura */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                {subscription ? 'Sua assinatura' : 'Escolha seu plano'}
              </CardTitle>
              <CardDescription>
                {subscription ? 'Gerencie sua assinatura premium' : 'Selecione a opção que melhor se adequa às suas necessidades'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 border border-primary bg-primary/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Plano Premium Mensal</p>
                      <p className="text-2xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.period}</span></p>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary" />
                  </div>
          {subscription && (
                    <div className="mt-3 text-left text-xs grid gap-1">
                      <p>Status: <span className="font-medium capitalize">{subscription.status}</span></p>
                      {subscription.startDate && !subscription.legacy && <p>Início: {new Date(subscription.startDate).toLocaleDateString()}</p>}
                      {subscription.endDate && <p>{subscription.legacy ? 'Expira:' : 'Fim:'} {new Date(subscription.endDate).toLocaleDateString()}</p>}
                      {subscription.legacy && <p className="text-amber-400">Assinatura legado (sem registro formal)</p>}
                    </div>
                  )}
                  {!subscription && !subLoading && fetchError && (
                    <p className="mt-3 text-left text-xs text-muted-foreground">{fetchError}</p>
                  )}
                  {!subscription && !subLoading && !fetchError && user?.premiumUntil && new Date(user.premiumUntil) > new Date() && (
                    <p className="mt-3 text-left text-xs text-emerald-400">Premium ativo até {new Date(user.premiumUntil).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
              {!subscription && (
                <>
                  <div className="space-y-3">
                    <Label htmlFor="email">Email para cobrança</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading || subLoading}
                    />
                  </div>
                  <Button 
                    onClick={handleCheckout}
                    className="w-full"
                    size="lg"
                    disabled={loading || subLoading}
                  >
                    {loading ? 'Processando...' : 'Assinar Premium'}
                  </Button>
                </>
              )}
              {subscription && (
                <div className="space-y-3">
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={cancelLoading}
                    onClick={() => setConfirmCancelOpen(true)}
                  >
                    {cancelLoading ? 'Cancelando...' : 'Cancelar Assinatura'}
                  </Button>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">Ao cancelar você mantém o acesso até o fim do ciclo vigente.</p>
                    <Button variant="outline" size="sm" disabled={subLoading} onClick={fetchSub}>Recarregar status</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>O que você terá</CardTitle>
              <CardDescription>
                Todos os recursos Premium inclusos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>Pagamento 100% seguro via Mercado Pago</p>
          <p>Cancele a qualquer momento</p>
          {subLoading && <p className="animate-pulse">Verificando sua assinatura...</p>}
        </div>
      </div>
      <ConfirmDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        title="Cancelar assinatura?"
        description="Você continuará com acesso premium até o fim do ciclo já pago."
        confirmText={cancelLoading ? 'Cancelando...' : 'Confirmar cancelamento'}
        cancelText="Voltar"
        variant="destructive"
        onConfirm={async () => {
          if (cancelLoading) return;
          setCancelLoading(true);
          try {
            await api.patch(`/subscription/${subscription._id}/cancel`);
            toast({ title: 'Assinatura cancelada', description: 'Acesso permanecerá até expirar o ciclo.', variant: 'success' });
            setSubscription(null);
            fetchSub();
          } catch (err: any) {
            const msg = err?.response?.data?.message || 'Falha ao cancelar assinatura.';
            toast({ title: 'Erro', description: msg, variant: 'destructive' });
          } finally { setCancelLoading(false); }
        }}
      />
    </main>
  );
};

export default Subscription;