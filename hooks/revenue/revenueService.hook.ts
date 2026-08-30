import {
    useMutation,
    useQuery,
    useQueryClient,
  } from "@tanstack/react-query";
  
  

  
  import {
    revenueServiceService,
  } from "@/services/revenue/revenueService.service";
  import { ListResponse } from "@/types/api";
  import { useRouter } from "next/navigation";
  import { toast } from "sonner";
import { CreateRevenueServicePayload, RevenueService, RevenueServiceFilters, RevenueServiceSummary, UpdateRevenueServicePayload } from "@/types/revenue/revenu-service";
  
  
  
  
  
  /* --------------------------------------
     Revenue Services
  -------------------------------------- */
  
  
  export const useRevenueServices = (
    params?: RevenueServiceFilters
  ) => {
  
    return useQuery<ListResponse<RevenueService,RevenueServiceSummary>> ({
  
      queryKey:[
        "revenue-services",
        params,
      ],
  
  
      queryFn:() =>
        revenueServiceService.getServices(
          params
        ),
  
  
      staleTime:
        1000 * 60 * 2,
  
  
      placeholderData:
        (previousData)=>previousData,
  
    });
  
  };
  
  
  
  
  
  
  
  /* --------------------------------------
     Revenue Service Details
  -------------------------------------- */
  
  
  export const useRevenueService = (
    id:string,
    enabled=true
  )=>{
  
  
    return useQuery({
  
      queryKey:[
        "revenue-service",
        id,
      ],
  
  
      queryFn:() =>
        revenueServiceService.getServiceById(
          id
        ),
  
  
      enabled:
        enabled && !!id,
  
  
      staleTime:
        1000 * 60 * 2,
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Create Revenue Service
  -------------------------------------- */
  
  
  export const useCreateRevenueService = () => {
    const router = useRouter();
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:(
        data:CreateRevenueServicePayload
      ) =>
        revenueServiceService.createService(
          data
        ),
  
  
  
      onSuccess:()=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "revenue-services",
          ],
  
        });
  
        toast.success(
          "Revenue service created successfully"
        );
  
  
  
        router.push(
            "/office/dashboard/revenue-managements/services"
        );
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Update Revenue Service
  -------------------------------------- */
  
  
  export const useUpdateRevenueService = () => {
    const router = useRouter();

  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:({
  
        id,
  
        data,
  
      }:{
  
        id:string;
  
        data:UpdateRevenueServicePayload;
  
      }) =>
  
        revenueServiceService.updateService(
          id,
          data
        ),
  
  
  
  
      onSuccess:(_,variables)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "revenue-services",
          ],
  
        });
  
  

        toast.success(
          "Revenue service created successfully"
        );
  
  
  
        router.push(
            "/office/dashboard/revenue-managements/services"
        );
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Activate Revenue Service
  -------------------------------------- */
  
  
  export const useActivateRevenueService = () => {
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:(
        id:string
      ) =>
        revenueServiceService.activateService(
          id
        ),
  
  
  
      onSuccess:(_,id)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "revenue-services",
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "revenue-service",
            id,
          ],
  
        });
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Deactivate Revenue Service
  -------------------------------------- */
  
  
  export const useDeactivateRevenueService = () => {
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:(
        id:string
      ) =>
        revenueServiceService.deactivateService(
          id
        ),
  
  
  
      onSuccess:(_,id)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "revenue-services",
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "revenue-service",
            id,
          ],
  
        });
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Delete Revenue Service
  -------------------------------------- */
  
  
  export const useDeleteRevenueService = () => {
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:(
        id:string
      ) =>
        revenueServiceService.deleteService(
          id
        ),
  
  
  
      onSuccess:()=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "revenue-services",
          ],
  
        });
  
  
      },
  
  
    });
  
  
  };