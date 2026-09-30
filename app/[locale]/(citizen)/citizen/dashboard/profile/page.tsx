// app/[locale]/citizen/dashboard/profile/page.tsx
// Adjust the import path to wherever you keep ProfilePanel.

import { ProfilePanel } from "@/components/citizen/panels/ProfilePanel";

export default function ProfilePage() {
  return (
    <div className="min-w-0">
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Your personal details and account information.
          </p>
        </header>

        <ProfilePanel />
      </div>
    </div>
  );
}