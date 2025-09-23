import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
}

export const RatingStars = ({ value, onChange, size = 20, readOnly, className }: RatingStarsProps) => {
  const rounded = Math.round(value * 2) / 2; // halves supported visually
  const handleClick = (i: number) => {
    if (!readOnly && onChange) onChange(i);
  };

  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={`Avaliação: ${value} de 5`}>
      {[1,2,3,4,5].map((i) => {
        const filled = i <= Math.floor(rounded);
        const half = !filled && i - rounded === 0.5;
        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(i)}
            disabled={readOnly}
            className={cn("disabled:cursor-default", readOnly && "cursor-default")}
            aria-label={`${i} estrelas`}
          >
            <Star
              size={size}
              className={cn(
                filled ? "text-primary" : "text-muted-foreground",
                !readOnly && "transition-transform hover:scale-110"
              )}
              {...(filled || half ? { fill: "currentColor" } : {})}
            />
          </button>
        );
      })}
    </div>
  );
};
