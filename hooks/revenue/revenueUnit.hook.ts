import {
    useMutation,
    useQuery,
    useQueryClient,
  } from "@tanstack/react-query";
  
  
  import {
    ApiResponse,
    ListResponse,
  } from "@/types/api";
  
  import { useRouter } from "next/navigation";
  import { toast } from "sonner";
import { MeasurementUnit, MeasurementUnitFilters } from "@/types/revenue/revenue-unit";
import { measurementUnitService } from "@/services/revenue/revenueUnit.service";
  
  
  
  
  
  /* --------------------------------------
     Measurement Units
  -------------------------------------- */
  
  export const useMeasurementUnits = (
    params?: MeasurementUnitFilters
  ) => {
  
  
    return useQuery<ListResponse<MeasurementUnit>>({
  
      queryKey:[
        "measurement-units",
        params,
      ],
  
  
      queryFn:() =>
        measurementUnitService.getUnits(
          params
        ),
  
  
      staleTime:
        1000 * 60 * 5,
  
  
      placeholderData:
        (previousData)=>previousData,
  
    });
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Measurement Unit Detail
  -------------------------------------- */
  
  export const useMeasurementUnit = (
    id:string,
    enabled=true
  )=>{
  
  
    return useQuery({
  
      queryKey:[
        "measurement-unit",
        id,
      ],
  
  
      queryFn:() =>
        measurementUnitService.getUnitById(
          id
        ),
  
  
      enabled:
        enabled && !!id,
  
  
      staleTime:
        1000 * 60 * 5,
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Create Unit
  -------------------------------------- */
  
  export const useCreateMeasurementUnit = () => {
  
  
    const router = useRouter();
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:(
        data:Partial<MeasurementUnit>
      ) =>
        measurementUnitService.createUnit(
          data
        ),
  
  
  
      onSuccess:()=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "measurement-units",
          ],
  
        });
  
  
        toast.success(
          "Measurement unit created successfully"
        );
  
  
        router.push(
          "/office/dashboard/settings/measurement-units"
        );
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Update Unit
  -------------------------------------- */
  
  export const useUpdateMeasurementUnit = () => {
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:({
  
        id,
  
        data,
  
      }:{
  
        id:string;
  
        data:Partial<MeasurementUnit>;
  
      }) =>
  
        measurementUnitService.updateUnit(
          id,
          data
        ),
  
  
  
      onSuccess:(_,variables)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "measurement-units",
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "measurement-unit",
            variables.id,
          ],
  
        });
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Activate Unit
  -------------------------------------- */
  
  export const useActivateMeasurementUnit = () => {
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:(
        id:string
      ) =>
        measurementUnitService.activateUnit(
          id
        ),
  
  
  
      onSuccess:(_,id)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "measurement-units",
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "measurement-unit",
            id,
          ],
  
        });
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Deactivate Unit
  -------------------------------------- */
  
  export const useDeactivateMeasurementUnit = () => {
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:(
        id:string
      ) =>
        measurementUnitService.deactivateUnit(
          id
        ),
  
  
  
      onSuccess:(_,id)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "measurement-units",
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "measurement-unit",
            id,
          ],
  
        });
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Delete Unit
  -------------------------------------- */
  
  export const useDeleteMeasurementUnit = () => {
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:(
        id:string
      ) =>
        measurementUnitService.deleteUnit(
          id
        ),
  
  
  
      onSuccess:()=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "measurement-units",
          ],
  
        });
  
  
      },
  
  
    });
  
  
  };