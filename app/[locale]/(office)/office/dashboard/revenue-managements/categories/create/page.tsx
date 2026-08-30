"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Layers } from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import {
    RevenueCategoryForm,
    RevenueCategoryFormValues,
} from "@/components/forms/RevenueCategoryForm";
import { useCreateRevenueCategory } from "@/hooks/revenue/revenueCategory.hook";



export default function CreateRevenueCategoryPage() {



    const {
        mutateAsync: createCategory,
        isPending,
    } = useCreateRevenueCategory();



    const handleSubmit = async (
        values: RevenueCategoryFormValues
    ) => {


            const payload = {

                revenue_domain: values.revenueDomain,

                name: values.name,

                start_code:
                    values.startCode || null,

                end_code:
                    values.endCode || null,

                description:
                    values.description || null,

                sort_order:
                    Number(values.sortOrder) || 0,

                is_active:
                    values.isActive,


                codes:
                    values.codes.map((item)=>({

                        code: item.code,

                        name: item.name,

                        description:
                            item.description || null,

                        is_active:
                            item.isActive,

                    })),

            };



            console.log(
                "Revenue category payload:",
                payload
            );



           const response =  await createCategory(payload);


    };



    return (

        <div className="space-y-6 max-w-5xl mx-auto">


            <Banner

                description="Define a new revenue category and its associated revenue codes."

                badge={

                    <IconBadge

                        className="p-3 text-xs bg-black/20 text-white gap-2 rounded-full"

                        icon={
                            <Layers className="w-4 h-4" />
                        }

                    >

                        New Revenue Category

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



            <RevenueCategoryForm

                mode="create"

                onSubmit={handleSubmit}

                isSubmitting={isPending}

            />



        </div>

    );
}