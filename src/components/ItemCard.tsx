import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

// BaseItem não estava definido em lugar nenhum; definimos aqui o contrato mínimo usado pelo card
type BaseItem = {
  id: string;
  type: 'book';
  title: string;
  cover: string;
  description: string;
};

type AnyBook = BaseItem & { author?: string; authors?: string[]; averageRating?: number; reviewCount?: number };
interface ItemCardProps { item: AnyBook; }

export const ItemCard = ({ item }: ItemCardProps) => {
  const navigate = useNavigate();
  const go = () => {
    if (item.type === "book") navigate(`/livro/${item.id}`);
  };

  return (
    <article className="group rounded-lg border bg-card shadow-soft overflow-hidden hover:shadow-elevated transition-shadow flex flex-col">
      <div className="aspect-[2/3] overflow-hidden">
        <img
          src={item.cover}
          alt={`${item.title} capa`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold leading-tight line-clamp-2 min-h-[2.7rem]">{item.title}</h3>
        {/* Linha de autor sempre presente para estabilizar a altura */}
        <p className="text-sm text-muted-foreground min-h-[1.25rem]">{(item as any).author || '\u00A0'}</p>
        <div className="flex items-center justify-between pt-2 mt-auto">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {typeof (item as any).averageRating === 'number' && (
              (() => {
                const avg = (item as any).averageRating as number;
                const reviews = (item as any).reviewCount ?? 0;
                const hasReviews = reviews > 0 && avg > 0; // usa >0 pra dourar; 0 significa sem avaliações
                return (
                  <span className="flex items-center gap-0.5" title={hasReviews ? `Nota média ${avg.toFixed(1)} (${reviews} review${reviews===1?'':'s'})` : 'Ainda sem reviews'}>
                    <Star className={`h-3 w-3 drop-shadow-sm ${hasReviews ? 'text-amber-400 fill-amber-400' : 'text-white fill-white'}`} />
                    <span>{avg.toFixed(1)}</span>
                  </span>
                );
              })()
            )}
          </div>
          <Button variant="soft" size="sm" onClick={go} aria-label="Ver detalhes">
            Ver detalhes
          </Button>
        </div>
      </div>
    </article>
  );
};
