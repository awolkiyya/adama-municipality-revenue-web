"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Phone, Loader2, AlertCircle, CodeXml, Handshake } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import CitizenUserLogin from "./forms/CitizenUserLogin";


// const PHONE_PATTERN = /^(\+251|0)?9\d{8}$/;


// function formatPhoneHint(value: string) {
//   if (!value) return null;

//   if (!PHONE_PATTERN.test(value.trim())) {
//     return "Enter a valid Ethiopian phone number.";
//   }

//   return null;
// }



export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        className
      )}
      {...props}
    >

     <CitizenUserLogin/>

    {/* Developer Credit Section */}
    <div className="flex flex-col items-center gap-1 text-muted-foreground">
    <div className="flex items-center gap-2 text-sm font-semibold">
      <CodeXml className="size-4" />
      <Handshake className="size-4" />
      <span>Developed by</span>
    </div>
    <p className="text-sm">Software Engineer Awol Abdulbaasit</p>
    </div>


    </div>
  );
}