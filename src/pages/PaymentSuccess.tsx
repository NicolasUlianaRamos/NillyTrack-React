import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sparkles, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const PaymentSuccess = () => {
  return (
    <>
      <Helmet>
        <title>Pagamento Confirmado - BookWise</title>
        <meta name="description" content="Seu pagamento foi processado com sucesso! Bem-vindo ao plano premium." />
      </Helmet>
      
      <main className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-background/95 backdrop-blur-sm border-primary/20 shadow-elegant">
          <CardContent className="p-8 text-center space-y-6">
            {/* Success Icon with Animation */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-primary rounded-full w-full h-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-primary animate-bounce" />
              </div>
            </div>

            {/* Title with Premium Badge */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-premium" />
                <span className="text-premium font-semibold">Premium</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Pagamento Confirmado!
              </h1>
              <p className="text-muted-foreground text-lg">
                Parabéns! Sua assinatura premium foi ativada com sucesso.
              </p>
            </div>

            {/* Benefits List */}
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <h3 className="font-semibold text-foreground mb-3">O que você ganhou:</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Acesso ilimitado a todos os livros</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Downloads para leitura offline</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Suporte prioritário</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Sem anúncios</span>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="space-y-3 pt-4">
              <Button asChild className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
                <Link to="/biblioteca">
                  Explorar Minha Biblioteca
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">
                  Voltar ao Início
                </Link>
              </Button>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-muted-foreground pt-4">
              Você receberá um email de confirmação em breve.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default PaymentSuccess;