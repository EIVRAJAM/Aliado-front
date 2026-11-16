import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { opportunitiesGateway } from '../services/opportunities-gateway-instance';
import {
  emptyOpportunityFilters,
  type Opportunity,
  type OpportunityCategory,
  type OpportunityFilters,
} from '../types/opportunity';
import { useOpportunitiesError } from './useOpportunitiesError';

export function useOpportunitiesBoard() {
  const { session } = useAuthSession();
  const resolveError = useOpportunitiesError();
  const [categories, setCategories] = useState<OpportunityCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filters, setFilters] = useState<OpportunityFilters>(emptyOpportunityFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadCategories = useCallback(async () => {
    if (!session || session.role !== 'PRESTADOR') {
      setCategoriesLoading(false);
      return;
    }

    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      setCategories(await opportunitiesGateway.getCategories(session.token));
    } catch (loadError) {
      const message = resolveError(loadError, 'No fue posible cargar las categorías.');
      if (message) {
        setCategoriesError(message);
      }
    } finally {
      setCategoriesLoading(false);
    }
  }, [resolveError, session]);

  const load = useCallback(async () => {
    if (!session || session.role !== 'PRESTADOR') {
      setLoading(false);
      return;
    }

    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const nextOpportunities = await opportunitiesGateway.list(session.token, filters);
      if (currentRequest === requestId.current) {
        setOpportunities(nextOpportunities);
      }
    } catch (loadError) {
      if (currentRequest !== requestId.current) {
        return;
      }
      setOpportunities([]);
      const message = resolveError(
        loadError,
        'No fue posible cargar las oportunidades. Intenta de nuevo.'
      );
      if (message) {
        setError(message);
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [filters, resolveError, session]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const applyFilters = useCallback((nextFilters: OpportunityFilters) => {
    setFilters({ ...nextFilters });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(emptyOpportunityFilters());
  }, []);

  return {
    categories,
    categoriesLoading,
    categoriesError,
    opportunities,
    filters,
    loading,
    error,
    applyFilters,
    clearFilters,
    reload: load,
    reloadCategories: loadCategories,
  };
}
