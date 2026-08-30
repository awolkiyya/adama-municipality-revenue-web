"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { UserForm } from "@/components/forms/UserForm";
import { useUser, useUpdateUser } from "@/hooks/useUser.hook";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useUser(id as string);

  const { mutateAsync: updateUser, isPending } = useUpdateUser();

  const handleSubmit = async (
    data: any,
    avatarFile?: File | null
  ) => {
    const formData = new FormData();
  
    // IMPORTANT: clean append (no null, no empty strings)
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
  
      // prevent sending avatar as string blob/url
      if (key === "avatar") return;
  
      formData.append(key, String(value));
    });
  
    // file upload
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    if (typeof data.is_active === "boolean") {
      formData.append("is_active", data.is_active ? "1" : "0");
    }
  
    // required for Laravel PUT simulation
    formData.append("_method", "PUT");
  
    await updateUser({
      id: id as string,
      data: formData,
    });
    };

  // =========================
  // LOADING STATE (SKELETON)
  // =========================
  if (isLoading || !id) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-md" />
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-40 bg-muted rounded-xl" />
        <div className="h-60 bg-muted rounded-xl" />
        <div className="flex justify-end">
          <div className="h-10 w-32 bg-muted rounded-md" />
        </div>
      </div>
    );
  }

  // =========================
  // ERROR STATE
  // =========================
  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center">
        <div className="w-full rounded-xl border bg-muted/40 p-6 text-center space-y-4">

          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
            Failed to Load User
          </h2>

          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching user data.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              <RefreshCcw className="w-4 h-4" />
              Retry
            </button>

            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-md border hover:bg-muted transition"
            >
              Go Back
            </button>
          </div>

        </div>
      </div>
    );
  }

  // =========================
  // NO DATA FOUND STATE
  // =========================
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="text-xl font-semibold text-muted-foreground">
          User not found
        </div>

        <p className="text-sm text-muted-foreground">
          The user you are trying to edit does not exist or may have been deleted.
        </p>

        <button
          onClick={() => router.push("/users")}
          className="px-4 py-2 rounded-md bg-primary text-white"
        >
          Back to Users
        </button>
      </div>
    );
  }

  // =========================
  // MAIN UI
  // =========================
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Update User
      </h1>

      <UserForm
        mode="edit"
        initialData={user}
        onSubmit={handleSubmit}
        loading={isPending}
      />
    </div>
  );
}