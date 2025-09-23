import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CircleCheck, CircleAlert, TriangleAlert, Info } from "lucide-react";

const VariantIcon = ({ variant }: { variant?: string }) => {
  switch (variant) {
    case 'success':
      return <CircleCheck className="h-5 w-5 text-emerald-300" />
    case 'destructive':
      return <CircleAlert className="h-5 w-5 text-red-200" />
    case 'warning':
      return <TriangleAlert className="h-5 w-5 text-amber-200" />
    case 'info':
      return <Info className="h-5 w-5 text-sky-200" />
    default:
      return null
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant as any} {...props}>
            <div className="flex items-start gap-3">
              <VariantIcon variant={variant as string} />
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
