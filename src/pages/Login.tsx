
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useState } from "react";
import useAuth from "@/hooks/useAuth";

const Login = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  setSubmitting(true);
  await login({ email, password });
  setSubmitting(false);
  };

  return (
    <main className="container py-10">
      <Helmet>
        <title>Entrar — NillyTrack</title>
        <meta name="description" content="Faça login para gerenciar sua biblioteca e avaliações." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>
      <section className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm" htmlFor="email">Email</label>
            <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm" htmlFor="password">Senha</label>
            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <Button className="w-full" type="submit" disabled={loading || submitting}>
            {loading || submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">Não tem conta? <Link to="/cadastro" className="underline">Cadastre-se</Link></p>
      </section>
    </main>
  );
};

export default Login;
