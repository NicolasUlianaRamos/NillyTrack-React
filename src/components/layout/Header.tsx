import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, Shield, LogOut } from "lucide-react";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import useAuth from "@/hooks/useAuth";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, logout, user, loading } = useAuth();
  const [params] = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const [open, setOpen] = useState(false); // controla menu mobile

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    navigate(query ? `/busca?q=${encodeURIComponent(query)}` : "/");
  };

  const handleLogout = () => {
    logout();
    toast.success("Sessão encerrada com sucesso!");
    setOpen(false);
  };

  // Fecha o menu quando a rota muda
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  const closeMenu = () => setOpen(false);


  // Navegação para usuários logados
  const AuthenticatedNavItems = () => (
    <>
      <Button asChild variant="soft">
        <Link to="/comunidade" onClick={closeMenu}>Comunidade</Link>
      </Button>
      <Button asChild variant="soft">
        <Link to="/biblioteca" onClick={closeMenu}>Minha Biblioteca</Link>
      </Button>
      <Button asChild variant="soft">
        <Link to="/assinatura" onClick={closeMenu}>Premium</Link>
      </Button>
      { (user as any)?.role === 'admin' && (
        <Button asChild variant="ghost">
          <Link to="/admin" onClick={closeMenu}>
            <Shield className="h-4 w-4 mr-2" />
            Admin
          </Link>
        </Button>
      ) }
      <Button variant="ghost" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </>
  );

  // Navegação para visitantes (não logados)
  const GuestNavItems = () => (
    <>
      <Button asChild variant="soft">
        <Link to="/comunidade" onClick={closeMenu}>Comunidade</Link>
      </Button>
      <Button asChild variant="ghost">
        <Link to="/login" onClick={closeMenu}>Entrar</Link>
      </Button>
      <Button asChild variant="default">
        <Link to="/cadastro" onClick={closeMenu}>Criar conta</Link>
      </Button>
    </>
  );

  // Componente para escolher qual navegação exibir
  const NavigationItems = () => (
    <>
      {authenticated ? <AuthenticatedNavItems /> : <GuestNavItems />}
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between py-3">
        <Link to="/" className="font-bold tracking-tight text-lg md:text-xl">
          NillyTrack
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <NavigationItems />
          <ThemeToggle />
          {authenticated && !loading && (
            <Link to={user?._id ? `/perfil/${user._id}` : '/perfil'} aria-label="Perfil">
              <Avatar className="h-8 w-8 rounded-full ring-1 ring-primary/30">
                {(user as any)?.avatarUrl || user?.avatar ? (
                  <AvatarImage
                    src={(user as any)?.avatarUrl || user?.avatar}
                    alt={user?.name || 'Perfil'}
                    className="object-cover rounded-full"
                  />
                ) : null}
                <AvatarFallback>{(user?.name?.[0] || 'U').toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          {authenticated && !loading && (
            <Link to={user?._id ? `/perfil/${user._id}` : '/perfil'} aria-label="Perfil">
              <Avatar className="h-8 w-8 rounded-full ring-1 ring-primary/30">
                {(user as any)?.avatarUrl || user?.avatar ? (
                  <AvatarImage
                    src={(user as any)?.avatarUrl || user?.avatar}
                    alt={user?.name || 'Perfil'}
                    className="object-cover rounded-full"
                  />
                ) : null}
                <AvatarFallback>{(user?.name?.[0] || 'U').toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
          )}
      <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
        <nav className="flex flex-col gap-4 mt-8">
                <NavigationItems />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

    </header>
  );
};

export default Header;
