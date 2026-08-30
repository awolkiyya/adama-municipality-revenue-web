"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormError } from "./form-error";
import { Mail, Lock, LogIn, Sparkles, Loader2 } from "lucide-react";
import { officeLoginSchema, OfficeUserFormData } from "@/lib/zod-forms/officeLogin.schema";
import { Button } from "../ui/button";
import { useLogin } from "@/hooks/auth/useLogin";

export default function OfficeUserLogin() {
    // 1. Initialize mutation - isPending replaces your manual useState
    const { mutate: login, isPending } = useLogin();

    const form = useForm<OfficeUserFormData>({
        resolver: zodResolver(officeLoginSchema),
        defaultValues: { email: "", password: "" }
    });

    const onSubmit = (data: OfficeUserFormData) => {
        // 2. Call the mutation directly
        login(data);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
            {/* Email Field */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        {...form.register("email")}
                        placeholder="example@city.gov.et"
                        className="h-10 w-full rounded-md border bg-background pl-10 px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <FormError message={form.formState.errors.email?.message} />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        type="password"
                        {...form.register("password")}
                        placeholder="••••••••"
                        className="h-10 w-full rounded-md border bg-background pl-10 px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <FormError message={form.formState.errors.password?.message} />
            </div>

            {/* Submit Button */}
            <Button disabled={isPending} type="submit" className="w-full gap-2 py-4">
                {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Logging in...</>
                ) : (
                    <>
                        <LogIn className="h-4 w-4" />
                        <span>Login Now</span>
                    </>
                )}
            </Button>
        </form>
    );
}