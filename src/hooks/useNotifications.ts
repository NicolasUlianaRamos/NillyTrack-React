import { toast } from "@/hooks/use-toast";
import { useCallback } from "react";

type NotificationType = "success" | "error" | "info" | "warning";

interface NotifyOptions {
  title?: string;
  duration?: number;
}

interface UseNotificationsReturn {
  notify: (message: string | string[], type?: NotificationType, options?: NotifyOptions) => void;
  notifySuccess: (message: string | string[], options?: NotifyOptions) => void;
  notifyError: (message: string | string[], options?: NotifyOptions) => void;
  notifyWarning: (message: string | string[], options?: NotifyOptions) => void;
  notifyInfo: (message: string | string[], options?: NotifyOptions) => void;
}

export default function useNotifications(): UseNotificationsReturn {
  // Função para processar um único toast ou múltiplos
  const processToast = useCallback((message: string | string[], type: NotificationType = "info", options?: NotifyOptions) => {
    // Se for um array de mensagens, criar um toast para cada mensagem
    if (Array.isArray(message)) {
      message.forEach(msg => createSingleToast(msg, type, options));
    } else {
      createSingleToast(message, type, options);
    }
  }, []);

  // Função interna para criar um único toast
  const createSingleToast = useCallback((message: string, type: NotificationType, options?: NotifyOptions) => {
    const title = options?.title;
    const duration = options?.duration || 5000; // Padrão: 5 segundos
    
    const toastConfig = {
      title: title || getDefaultTitle(type),
      description: message,
      duration: duration,
    };
    
    switch (type) {
      case "success":
        toast({
          ...toastConfig,
          variant: "success",
        });
        break;
      case "error":
        toast({
          ...toastConfig,
          variant: "destructive",
        });
        break;
      case "warning":
        toast({
          ...toastConfig,
          variant: "warning",
        });
        break;
      case "info":
      default:
        toast({
          ...toastConfig,
          variant: "info",
        });
        break;
    }
  }, []);
  
  // Helper para obter títulos padrão
  const getDefaultTitle = (type: NotificationType): string => {
    switch (type) {
      case "success": return "Sucesso";
      case "error": return "Erro";
      case "warning": return "Atenção";
      case "info": 
      default: return "Informação";
    }
  };

  // API pública do hook
  const notify = useCallback((message: string | string[], type: NotificationType = "info", options?: NotifyOptions) => {
    processToast(message, type, options);
  }, [processToast]);

  const notifySuccess = useCallback((message: string | string[], options?: NotifyOptions) => {
    processToast(message, "success", options);
  }, [processToast]);

  const notifyError = useCallback((message: string | string[], options?: NotifyOptions) => {
    processToast(message, "error", options);
  }, [processToast]);

  const notifyWarning = useCallback((message: string | string[], options?: NotifyOptions) => {
    processToast(message, "warning", options);
  }, [processToast]);

  const notifyInfo = useCallback((message: string | string[], options?: NotifyOptions) => {
    processToast(message, "info", options);
  }, [processToast]);

  return { notify, notifySuccess, notifyError, notifyWarning, notifyInfo };
}
