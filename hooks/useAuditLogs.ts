// src/modules/audit/hooks/use-system-logs.ts

import {
    keepPreviousData,
    useQuery,
  } from '@tanstack/react-query';
  
  import { systemLogService } from '../services/system-log.service';
import { SystemLogQuery } from '@/types/auditLog';
  
  
  /**
   * ============================================================
   * QUERY KEYS
   * ============================================================
   */
  
  export const systemLogKeys = {
    all: ['system-logs'] as const,
  
    lists: () =>
      [...systemLogKeys.all, 'list'] as const,
  
    list: (params: SystemLogQuery) =>
      [...systemLogKeys.lists(), params] as const,
  
    details: () =>
      [...systemLogKeys.all, 'detail'] as const,
  
    detail: (id: string) =>
      [...systemLogKeys.details(), id] as const,
  };
  
  /**
   * ============================================================
   * LIST AUDIT LOGS
   * ============================================================
   */
  
  export function useSystemLogs(
    params: SystemLogQuery
  ) {
    return useQuery({
      queryKey: systemLogKeys.list(params),
  
      queryFn: () =>
        systemLogService.getAll(params),
  
      placeholderData: keepPreviousData,
  
      staleTime: 30_000,
  
      refetchOnWindowFocus: false,
    });
  }
  
  /**
   * ============================================================
   * SHOW AUDIT LOG
   * ============================================================
   */
  
  export function useSystemLog(
    id: string | null
  ) {
    return useQuery({
      queryKey: id
        ? systemLogKeys.detail(id)
        : [...systemLogKeys.details(), 'empty'],
  
      queryFn: () => {
        if (!id) {
          throw new Error(
            'System log ID is required'
          );
        }
  
        return systemLogService.getById(id);
      },
  
      enabled: Boolean(id),
  
      staleTime: 60_000,
  
      refetchOnWindowFocus: false,
    });
  }