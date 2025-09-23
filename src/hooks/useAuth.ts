import { useAuthContext } from '@/context/AuthContext';

// Hook legado agora apenas reexporta o contexto unificado
export default function useAuth() {
    return useAuthContext();
}
