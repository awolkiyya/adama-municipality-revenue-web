"use client";

import { GalleryVerticalEnd, CodeXml, Handshake, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import OfficeUserLogin from "@/components/forms/OfficeUserLogin";
import { AuthHeader } from "@/components/banner/AuthHeader";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
       {/* Sticky blurred header */}
       <AuthHeader/>
      <div className="flex w-full max-w-sm flex-col gap-6">
       
        <LoginForm />
        
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
    </div>
  );
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            👋 Welcome back
          </CardTitle>
          <CardDescription>
            Login with your email and password Now
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OfficeUserLogin />
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}