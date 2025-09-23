import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Index from "./pages/Index";
import Search from "./pages/Search";
import BookDetails from "./pages/BookDetails";
import Library from "./pages/Library";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Subscription from "./pages/Subscription";
import RequireAuth from './components/auth/RequireAuth';
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminReviews from "./pages/admin/AdminReviews";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import CategoryPage from "./pages/Category";
import Community from "./pages/Community";
import { AuthProvider } from '@/context/AuthContext';
import RequireAdmin from '@/components/auth/RequireAdmin';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <HelmetProvider>
            <AuthProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/livro/:id" element={<BookDetails />} />
                  <Route path="/busca" element={<Search />} />
                  <Route path="/categoria/:category" element={<CategoryPage />} />
                  <Route path="/comunidade" element={<Community />} />
                  <Route path="/biblioteca" element={<RequireAuth><Library /></RequireAuth>} />
                  <Route path="/perfil/editar/:userId" element={<RequireAuth><EditProfile /></RequireAuth>} />
                  <Route path="/perfil/:userId" element={<Profile />} />
                  <Route path="/assinatura" element={<RequireAuth><Subscription /></RequireAuth>} />
                  <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                  <Route path="/admin/usuarios" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
                  <Route path="/admin/assinaturas" element={<RequireAdmin><AdminSubscriptions /></RequireAdmin>} />
                  <Route path="/admin/reviews" element={<RequireAdmin><AdminReviews /></RequireAdmin>} />
                  <Route path="/retorno-assinatura" element={<RequireAuth><PaymentSuccess /></RequireAuth>} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/cadastro" element={<Register />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Footer />
              </div>
            </AuthProvider>
          </HelmetProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
export default App;
