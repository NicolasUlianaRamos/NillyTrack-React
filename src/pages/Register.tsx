
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useState } from "react";
import useAuth from "@/hooks/useAuth";
import useNotifications from "@/hooks/useNotifications";

const Register = () => {
  const { register } = useAuth();
  const { notifyError, notifySuccess } = useNotifications();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      notifyError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, confirmPassword });
      // Limpar campos se desejar após sucesso
      // setName(""); setEmail(""); setPassword(""); setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-10">
      <Helmet>
        <title>Criar conta — NillyTrack</title>
        <meta name="description" content="Crie sua conta para montar sua biblioteca, avaliar e descobrir." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>
      <section className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm" htmlFor="name">Nome</label>
            <Input id="name" required value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm" htmlFor="email">Email</label>
            <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm" htmlFor="password">Senha</label>
            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="text-sm" htmlFor="confirmPassword">Confirmar senha</label>
            <Input id="confirmPassword" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">Já tem conta? <Link to="/login" className="underline">Entrar</Link></p>
      </section>
    </main>
  );
};

export default Register;
