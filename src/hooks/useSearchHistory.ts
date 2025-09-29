import { useState, useEffect, useCallback } from 'react';

const SEARCH_HISTORY_KEY = 'nillytrack_search_history';
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export const useSearchHistory = () => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        } else {
          setHistory([]);
        }
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de pesquisa:', error);
      setHistory([]);
    }
  }, []);

  // Salvar histórico no localStorage
  const saveHistory = useCallback((newHistory: SearchHistoryItem[]) => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    setHistory(newHistory);
  }, []);

  // Adicionar nova pesquisa ao histórico
  const addSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    const normalizedQuery = query.trim().toLowerCase();
    
    setHistory(prevHistory => {
      // Remove duplicatas (case-insensitive)
      const filteredHistory = prevHistory.filter(
        item => item.query.toLowerCase() !== normalizedQuery
      );

      // Adiciona nova pesquisa no início
      const newHistory: SearchHistoryItem[] = [
        { query: query.trim(), timestamp: Date.now() },
        ...filteredHistory
      ].slice(0, MAX_HISTORY_ITEMS); // Limita o número máximo de itens

      // Salva no localStorage
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      
      return newHistory;
    });
  }, []);

  // Remover uma pesquisa específica do histórico
  const removeSearch = useCallback((queryToRemove: string) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.filter(item => item.query !== queryToRemove);
      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  // Limpar todo o histórico
  const clearHistory = useCallback(() => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setHistory([]);
  }, []);

  // Filtrar histórico baseado no texto digitado
  const getFilteredHistory = useCallback((inputValue: string) => {
    const trimmed = inputValue.trim();
    if (!trimmed) return history;

    const normalizedInput = trimmed.toLowerCase();
    // Antes: excluíamos igualdade exata; agora mantemos, para não sumir quando o usuário digita exatamente o termo do histórico
    return history.filter(item => item.query.toLowerCase().includes(normalizedInput));
  }, [history]);

  return {
    history,
    addSearch,
    removeSearch,
    clearHistory,
    getFilteredHistory
  };
};