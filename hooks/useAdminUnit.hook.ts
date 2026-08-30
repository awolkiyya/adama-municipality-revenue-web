import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminUnitService } from "@/services/adminUnit.service";


// --------------------------------------
// Administrative Units
// --------------------------------------

export const useAdminUnits = (params?: {
  level?: string;
  search?: string;
  page?: number;
  per_page?: number;
}) => {
  return useQuery({
    queryKey: ["admin-units", params],
    queryFn: () => adminUnitService.getAll(params),
    staleTime: 1000 * 60 * 2,
    placeholderData: (previousData) => previousData,
  });
};


// --------------------------------------
// Sectors
// --------------------------------------

export const useSectors = (params?: {
  cluster_id?: string;
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}) => {
  return useQuery({
    queryKey: ["sectors", params],
    queryFn: () => adminUnitService.getSectors(params),
    staleTime: 1000 * 60 * 2,
    placeholderData: (previousData) => previousData,
  });
};


// --------------------------------------
// Create Sector
// --------------------------------------

export const useCreateSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminUnitService.createSector,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sectors"],
      });
    },
  });
};


// --------------------------------------
// Update Sector
// --------------------------------------

export const useUpdateSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;

      data: {
        name?: string;
        code?: string;
        description?: string;
        cluster_id?: string;
        is_active?: boolean;
      };
    }) => adminUnitService.updateSector(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sectors"],
      });
    },
  });
};


// --------------------------------------
// Delete Sector
// --------------------------------------

export const useDeleteSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      adminUnitService.deleteSector(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sectors"],
      });
    },
  });
};