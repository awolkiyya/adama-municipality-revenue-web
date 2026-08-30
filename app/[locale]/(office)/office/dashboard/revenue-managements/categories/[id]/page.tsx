"use client";

import { useRouter, useParams } from "next/navigation";

import { toast } from "sonner";
import { Layers, TriangleAlert, ArrowLeft } from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FloatingParticles } from "@/components/design/FloatingParticles";

import {
    RevenueCategoryForm,
    RevenueCategoryFormValues,
} from "@/components/forms/RevenueCategoryForm";





import type {
    UpdateRevenueCategoryPayload,
} from "@/types/revenue/revenue-category";
import { useRevenueCategory, useUpdateRevenueCategory } from "@/hooks/revenue/revenueCategory.hook";





function mapToFormValues(
    record: any
): RevenueCategoryFormValues {


    return {


        id:record.id,
        revenueDomain:record.revenueDomain,


        name:
            record.name,


        startCode:
            record.startCode?.toString() ?? "",


        endCode:
            record.endCode?.toString() ?? "",


        description:
            record.description ?? "",


        sortOrder:
            record.sortOrder?.toString() ?? "0",


        isActive:
            record.isActive,


        codes:
            record.codes?.map((item:any)=>({

                id:item.id,

                code:item.code,

                name:item.name,

                description:
                    item.description ?? "",

                isActive:
                    item.isActive,

            })) ?? [],

    };

}






export default function EditRevenueCategoryPage(){


    const router = useRouter();


    const params =
        useParams<{
            id:string;
        }>();


    const id =
        params.id;



    /*
    |--------------------------------------------------------------------------
    | Fetch Category
    |--------------------------------------------------------------------------
    */


    const {
        data:category,
        isLoading,
        isError,

    } = useRevenueCategory(
        id
    );

    console.log("data comming",category?.data);




    /*
    |--------------------------------------------------------------------------
    | Update Mutation
    |--------------------------------------------------------------------------
    */


    const {
        mutateAsync:updateCategory,
        isPending,

    } = useUpdateRevenueCategory();





    const handleSubmit = async(
        values:RevenueCategoryFormValues
    )=>{
        console.log("data comming", category?.data);


        try {


            const payload:UpdateRevenueCategoryPayload = {


                revenue_domain:
                    values.revenueDomain,


                name:
                    values.name,


                start_code:
                    values.startCode
                        ? Number(values.startCode)
                        : null,


                end_code:
                    values.endCode
                        ? Number(values.endCode)
                        : null,


                description:
                    values.description || null,


                sortOrder:
                    Number(values.sortOrder) || 0,


                is_active:
                    values.isActive,


                codes:
                    values.codes.map(item=>({

                        ...(item.id && {
                            id:item.id,
                        }),
                        code:item.code,

                        name:item.name,

                        description:
                            item.description || null,

                        is_active:
                            item.isActive,

                    })),


            };


            console.log("payload",payload)




            await updateCategory({

                id,

                data:payload,

            });



            toast.success(
                "Revenue category updated successfully"
            );



            router.push(
                "/office/dashboard/revenue-managements/categories"
            );



        }catch(error){


            console.error(error);


            toast.error(
                "Failed to update revenue category"
            );

        }


    };





    return (

        <div className="space-y-6 max-w-5xl mx-auto">


            <Banner


                description="Update this revenue category and its associated revenue codes."


                badge={

                    <IconBadge

                        className="p-3 text-xs bg-black/20 text-white gap-2 rounded-full"

                        icon={
                            <Layers className="w-4 h-4"/>
                        }

                    >

                        Edit Revenue Category

                    </IconBadge>

                }



                background={

                    <FloatingParticles

                        color="#040404"

                        count={35}

                        speed={0.2}

                        connectDistance={100}

                        position="bottom-right"

                    />

                }



                overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"


                className="text-white"

            />






            {
                isLoading && (

                    <div className="space-y-4">


                        <Skeleton className="h-10 w-full"/>

                        <Skeleton className="h-10 w-full"/>


                        <div className="grid grid-cols-2 gap-4">

                            <Skeleton className="h-10 w-full"/>

                            <Skeleton className="h-10 w-full"/>

                        </div>


                        <Skeleton className="h-24 w-full"/>


                        <Skeleton className="h-40 w-full"/>


                    </div>

                )
            }







            {
                (isError || !category) && !isLoading && (

                    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center rounded-xl border border-dashed">


                        <div className="flex items-center justify-center size-12 rounded-full bg-muted">

                            <TriangleAlert className="size-6 text-muted-foreground"/>

                        </div>



                        <div>


                            <p className="text-sm font-medium">

                                Category not found

                            </p>


                            <p className="text-sm text-muted-foreground mt-1">

                                This revenue category may have been deleted.

                            </p>


                        </div>



                        <Button

                            variant="outline"

                            onClick={()=>router.push(
                                "/office/dashboard/revenue-managements/categories"
                            )}

                        >

                            <ArrowLeft className="mr-2 size-4"/>

                            Back to Revenue Categories

                        </Button>


                    </div>

                )

            }








            {
                category && !isLoading && (

                    <RevenueCategoryForm


                        mode="edit"


                        initialValues={
                            mapToFormValues(category.data)
                        }


                        onSubmit={
                            handleSubmit
                        }


                        isSubmitting={
                            isPending
                        }


                    />

                )
            }




        </div>

    );

}