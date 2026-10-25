import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  TariffVersion,
  CreateTariffVersionPayload,
  UpdateTariffVersionPayload,
  CurrentActiveTariffSummary,
  DuplicateTariffVersionVariables,
} from "@/types/revenue/tariff-version";

import {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import { toast } from "sonner";

import { tariffVersionService } from "@/services/revenue/tariffVersion.service";



// ---------------------------------------------------------------------------
// GET ALL TARIFF VERSIONS
// ---------------------------------------------------------------------------

export const useTariffVersions = (
  params?: {
    search?: string;
    year?: number;
    is_active?: boolean;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_direction?: "asc" | "desc";
  },
) => {
  return useQuery<
    ListResponse<TariffVersion, CurrentActiveTariffSummary>
  >({
    queryKey: ["tariff-versions", params],

    queryFn: () =>
      tariffVersionService.getTariffVersions(params),

    staleTime: 1000 * 60 * 2,

    placeholderData: (previousData) => previousData,
  });
};

// ---------------------------------------------------------------------------
// GET CURRENT ACTIVE TARIFF SUMMARY
// ---------------------------------------------------------------------------

export const useCurrentActiveTariff = () => {
  return useQuery<ApiResponse<CurrentActiveTariffSummary>>({
    queryKey: ["current-active-tariff"],

    queryFn: () => tariffVersionService.getSummary(),

    staleTime: 1000 * 60 * 5,
  });
};

// ---------------------------------------------------------------------------
// GET SINGLE TARIFF VERSION
// ---------------------------------------------------------------------------

export const useTariffVersion = (
  id: string,
  enabled = true,
) => {
  return useQuery<ApiResponse<TariffVersion>>({
    queryKey: ["tariff-version", id],

    queryFn: () =>
      tariffVersionService.getTariffVersionById(id),

    enabled: enabled && !!id,

    staleTime: 1000 * 60 * 2,
  });
};

// ---------------------------------------------------------------------------
// CREATE TARIFF VERSION
// ---------------------------------------------------------------------------

export const useCreateTariffVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTariffVersionPayload) =>
      tariffVersionService.createTariffVersion(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tariff-versions"],
      });

      queryClient.invalidateQueries({
        queryKey: ["current-active-tariff"],
      });

      toast.success("Tariff version created successfully");
    },
  });
};

// ---------------------------------------------------------------------------
// UPDATE TARIFF VERSION
// ---------------------------------------------------------------------------

export const useUpdateTariffVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTariffVersionPayload;
    }) =>
      tariffVersionService.updateTariffVersion(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tariff-versions"],
      });

      queryClient.invalidateQueries({
        queryKey: ["tariff-version", variables.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["current-active-tariff"],
      });

      toast.success("Tariff version updated successfully");
    },
  });
};

// ---------------------------------------------------------------------------
// DUPLICATE TARIFF VERSION
// ---------------------------------------------------------------------------

export const useDuplicateTariffVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: DuplicateTariffVersionVariables) =>
      tariffVersionService.duplicateTariffVersion(id, data),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["tariff-versions"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["tariff-version", variables.id],
        }),

        queryClient.invalidateQueries({
          queryKey: ["current-active-tariff"],
        }),
      ]);

      toast.success(
        "Tariff version duplicated successfully. Review its rules and formulas before approval.",
      );
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to duplicate tariff version",
      );
    },
  });
};

// ---------------------------------------------------------------------------
// ACTIVATE TARIFF VERSION
// ---------------------------------------------------------------------------

export const useActivateTariffVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      tariffVersionService.activateTariffVersion(id),

    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["tariff-versions"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["tariff-version", id],
        }),

        queryClient.invalidateQueries({
          queryKey: ["current-active-tariff"],
        }),
      ]);

      toast.success("Tariff version activated successfully");
    },
  });
};

// ---------------------------------------------------------------------------
// DELETE TARIFF VERSION
// ---------------------------------------------------------------------------

export const useDeleteTariffVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      tariffVersionService.deleteTariffVersion(id),

    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["tariff-versions"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["tariff-version", id],
        }),

        queryClient.invalidateQueries({
          queryKey: ["current-active-tariff"],
        }),
      ]);

      toast.success("Tariff version deleted successfully");
    },
  });
};

// ---------------------------------------------------------------------------
// RESTORE TARIFF VERSION
// ---------------------------------------------------------------------------

export const useRestoreTariffVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      tariffVersionService.restoreTariffVersion(id),

    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["tariff-versions"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["tariff-version", id],
        }),
      ]);

      toast.success("Tariff version restored successfully");
    },
  });
};
