"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";


interface RoleGuardProps {

    roles: string[];

    children: ReactNode;

    fallback?: ReactNode;
}


export default function RoleGuard({
    roles,
    children,
    fallback = null,
}: RoleGuardProps) {


    const router = useRouter();


    const {
        hasAnyRole
    } = usePermission();



    const allowed = hasAnyRole(roles);



    if (!allowed) {

        if (fallback) {
            return fallback;
        }


        router.replace("/unauthorized");

        return null;
    }


    return children;
}