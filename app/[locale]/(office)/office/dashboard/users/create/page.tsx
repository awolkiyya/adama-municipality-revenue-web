"use client";

import { UserForm } from "@/components/forms/UserForm";
import { useCreateUser } from "@/hooks/useUser.hook";

export default function CreateUserPage() {

  const { mutateAsync: updateUser, isPending } = useCreateUser();


  const handleSubmit = async (data: any) => {
     await updateUser(data);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Create User</h1>

      <UserForm mode="create" onSubmit={handleSubmit}  loading={isPending}/>
    </div>
  );
}