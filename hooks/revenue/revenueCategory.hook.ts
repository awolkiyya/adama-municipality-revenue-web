import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";


import {
  CreateRevenueCategoryPayload,
  RevenueCategory,
  RevenueCategoryFilters,
  RevenueCategorySummary,
  UpdateRevenueCategoryPayload,
} from "@/types/revenue/revenue-category";


import {
  revenueCategoryService,
} from "@/services/revenue/revenuCategory.service";
import { ListResponse } from "@/types/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";





/* --------------------------------------
   Revenue Categories
-------------------------------------- */


export const useRevenueCategories = (
  params?: RevenueCategoryFilters
) => {

  return useQuery<ListResponse<RevenueCategory,RevenueCategorySummary>> ({

    queryKey:[
      "revenue-categories",
      params,
    ],


    queryFn:() =>
      revenueCategoryService.getCategories(
        params
      ),


    staleTime:
      1000 * 60 * 2,


    placeholderData:
      (previousData)=>previousData,

  });

};







/* --------------------------------------
   Revenue Category Details
-------------------------------------- */


export const useRevenueCategory = (
  id:string,
  enabled=true
)=>{


  return useQuery({

    queryKey:[
      "revenue-category",
      id,
    ],


    queryFn:() =>
      revenueCategoryService.getCategoryById(
        id
      ),


    enabled:
      enabled && !!id,


    staleTime:
      1000 * 60 * 2,

  });


};









/* --------------------------------------
   Create Revenue Category
-------------------------------------- */


export const useCreateRevenueCategory = () => {
  const router = useRouter();


  const queryClient =
    useQueryClient();



  return useMutation({


    mutationFn:(
      data:CreateRevenueCategoryPayload
    ) =>
      revenueCategoryService.createCategory(
        data
      ),



    onSuccess:()=>{


      queryClient.invalidateQueries({

        queryKey:[
          "revenue-categories",
        ],

      });

      toast.success(
        "Revenue category created successfully"
      );



      router.push(
          "/office/dashboard/revenue-managements/categories"
      );


    },


  });


};









/* --------------------------------------
   Update Revenue Category
-------------------------------------- */


export const useUpdateRevenueCategory = () => {


  const queryClient =
    useQueryClient();



  return useMutation({


    mutationFn:({

      id,

      data,

    }:{

      id:string;

      data:UpdateRevenueCategoryPayload;

    }) =>

      revenueCategoryService.updateCategory(
        id,
        data
      ),




    onSuccess:(_,variables)=>{


      queryClient.invalidateQueries({

        queryKey:[
          "revenue-categories",
        ],

      });



      queryClient.invalidateQueries({

        queryKey:[
          "revenue-category",
          variables.id,
        ],

      });


    },


  });


};









/* --------------------------------------
   Activate Revenue Category
-------------------------------------- */


export const useActivateRevenueCategory = () => {


  const queryClient =
    useQueryClient();



  return useMutation({


    mutationFn:(
      id:string
    ) =>
      revenueCategoryService.activateCategory(
        id
      ),



    onSuccess:(_,id)=>{


      queryClient.invalidateQueries({

        queryKey:[
          "revenue-categories",
        ],

      });



      queryClient.invalidateQueries({

        queryKey:[
          "revenue-category",
          id,
        ],

      });


    },


  });


};









/* --------------------------------------
   Deactivate Revenue Category
-------------------------------------- */


export const useDeactivateRevenueCategory = () => {


  const queryClient =
    useQueryClient();



  return useMutation({


    mutationFn:(
      id:string
    ) =>
      revenueCategoryService.deactivateCategory(
        id
      ),



    onSuccess:(_,id)=>{


      queryClient.invalidateQueries({

        queryKey:[
          "revenue-categories",
        ],

      });



      queryClient.invalidateQueries({

        queryKey:[
          "revenue-category",
          id,
        ],

      });


    },


  });


};









/* --------------------------------------
   Delete Revenue Category
-------------------------------------- */


export const useDeleteRevenueCategory = () => {


  const queryClient =
    useQueryClient();



  return useMutation({


    mutationFn:(
      id:string
    ) =>
      revenueCategoryService.deleteCategory(
        id
      ),



    onSuccess:()=>{


      queryClient.invalidateQueries({

        queryKey:[
          "revenue-categories",
        ],

      });


    },


  });


};