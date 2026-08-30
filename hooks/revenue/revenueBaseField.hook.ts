import {
    useMutation,
    useQuery,
    useQueryClient,
  } from "@tanstack/react-query";
  
  
  import {
    ListResponse,
  } from "@/types/api";
  
  import { useRouter } from "next/navigation";
  import { toast } from "sonner";
import { BaseField, BaseFieldFilters } from "@/types/revenue/revenue-baseField";
import { baseFieldService } from "@/services/revenue/revenueBaseField.service";
  
  
  
  
  
  /* --------------------------------------
     Base Fields
  -------------------------------------- */
  
  export const useBaseFields = (
    params?: BaseFieldFilters
  )=>{
  
  
    return useQuery<ListResponse<BaseField>>({
  
      queryKey:[
        "base-fields",
        params,
      ],
  
  
      queryFn:()=> 
        baseFieldService.getBaseFields(
          params
        ),
  
  
      staleTime:
        1000 * 60 * 5,
  
  
      placeholderData:
        (previousData)=>previousData,
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Base Field Detail
  -------------------------------------- */
  
  export const useBaseField = (
    id:string,
    enabled=true
  )=>{
  
  
    return useQuery({
  
      queryKey:[
        "base-field",
        id,
      ],
  
  
      queryFn:()=>
        baseFieldService.getBaseFieldById(
          id
        ),
  
  
      enabled:
        enabled && !!id,
  
  
      staleTime:
        1000 * 60 * 5,
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Create Base Field
  -------------------------------------- */
  
  export const useCreateBaseField = ()=>{
  
  
    const router = useRouter();
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:(
        data:Partial<BaseField>
      ) =>
        baseFieldService.createBaseField(
          data
        ),
  
  
  
      onSuccess:()=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "base-fields",
          ],
  
        });
  
  
  
        toast.success(
          "Base field created successfully"
        );
  
  
        router.push(
          "/office/dashboard/settings/base-fields"
        );
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Update Base Field
  -------------------------------------- */
  
  export const useUpdateBaseField = ()=>{
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:({
  
        id,
  
        data,
  
      }:{
  
        id:string;
  
        data:Partial<BaseField>;
  
      })=>
  
        baseFieldService.updateBaseField(
          id,
          data
        ),
  
  
  
      onSuccess:(_,variables)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "base-fields",
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "base-field",
            variables.id,
          ],
  
        });
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Activate Base Field
  -------------------------------------- */
  
  export const useActivateBaseField = ()=>{
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:(
        id:string
      )=>
  
        baseFieldService.activateBaseField(
          id
        ),
  
  
  
      onSuccess:(_,id)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "base-fields",
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "base-field",
            id,
          ],
  
        });
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Deactivate Base Field
  -------------------------------------- */
  
  export const useDeactivateBaseField = ()=>{
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:(
        id:string
      )=>
  
        baseFieldService.deactivateBaseField(
          id
        ),
  
  
  
      onSuccess:(_,id)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "base-fields",
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "base-field",
            id,
          ],
  
        });
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     Delete Base Field
  -------------------------------------- */
  
  export const useDeleteBaseField = ()=>{
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:(
        id:string
      )=>
  
        baseFieldService.deleteBaseField(
          id
        ),
  
  
  
      onSuccess:()=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "base-fields",
          ],
  
        });
  
  
      },
  
  
    });
  
  
  };