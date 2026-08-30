import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  CitizenFilters,
  CitizenFormData,
} from "@/types/citizen";

import { citizenService } from "@/services/taxpayers.service";

/* --------------------------------------
   Citizens
-------------------------------------- */

export const useCitizens = (
  params?: CitizenFilters
) => {
  return useQuery({
    queryKey: ["citizens", params],
    queryFn: () => citizenService.getAll(params),
    staleTime: 1000 * 60 * 2,
    placeholderData: (previousData) => previousData,
  });
};

/* --------------------------------------
   Citizen Details
-------------------------------------- */

export const useCitizen = (
  id: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["citizen", id],
    queryFn: () => citizenService.getById(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 2,
  });
};

/* --------------------------------------
   Create Citizen
-------------------------------------- */

export const useCreateCitizen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CitizenFormData) =>
      citizenService.create(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["citizens"],
      });
    },
  });
};

/* --------------------------------------
   Update Citizen
-------------------------------------- */

export const useUpdateCitizen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CitizenFormData;
    }) => citizenService.update(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["citizens"],
      });

      queryClient.invalidateQueries({
        queryKey: ["citizen", variables.id],
      });
    },
  });
};

/* --------------------------------------
   Toggle Citizen Status
-------------------------------------- */

/**
 * Activates or deactivates a citizen.
 *
 * Expected backend endpoint:
 *
 * PATCH /citizens/{id}/status
 *
 * Request:
 *
 * {
 *     is_active: true
 * }
 *
 * or
 *
 * {
 *     is_active: false
 * }
 */
export const useToggleCitizenStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) =>
      citizenService.toggleStatus(
        id,
        isActive
      ),

    onSuccess: (_, variables) => {
      /**
       * Refresh citizen list so the table immediately
       * reflects the new status.
       */
      queryClient.invalidateQueries({
        queryKey: ["citizens"],
      });

      /**
       * Refresh the individual citizen if it is currently
       * cached/open.
       */
      queryClient.invalidateQueries({
        queryKey: ["citizen", variables.id],
      });
    },
  });
};

/* --------------------------------------
   Delete Citizen
-------------------------------------- */

export const useDeleteCitizen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      citizenService.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["citizens"],
      });
    },
  });
};

/* --------------------------------------
   Import Citizens
-------------------------------------- */

export const useImportCitizens = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (progress: number) => void;
    }) =>
      citizenService.import(
        file,
        onProgress
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["citizens"],
      });
    },
  });
};

/* --------------------------------------
   Download Import Template
-------------------------------------- */

export const useDownloadCitizenTemplate = () => {
  return useMutation({
    mutationFn: () =>
      citizenService.downloadTemplate(),
  });
};

/* --------------------------------------
   Export Citizens
-------------------------------------- */

export const useExportCitizens = () => {
  return useMutation({
    mutationFn: (
      params?: CitizenFilters
    ) =>
      citizenService.export(params),
  });
};