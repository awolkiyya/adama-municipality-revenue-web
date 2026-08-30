"use client";

import {
  Bell,
  ChevronsUpDown,
  LogOut,
  Settings,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { AuthUser } from "@/types/user";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getInitials } from "@/utils/getInitials";
import { useLogout } from "@/hooks/auth/useLogout";

export function NavUser({ user }: { user: AuthUser }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const t = useTranslations("nav.user");

  const logoutMutation = useLogout();

  const handleLogout = () => {
    if (logoutMutation.isPending) {
      return;
    }

    logoutMutation.mutate();
  };

  const avatarSrc = user.avatar || "";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={avatarSrc || undefined}
                  alt={user.name}
                />

                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left text-sm">
                <span className="truncate font-medium">
                  {user.name}
                </span>

                <span className="truncate text-xs">
                  {user.email}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={avatarSrc || undefined}
                    alt={user.name}
                  />

                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.name}
                  </span>

                  <span className="truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={logoutMutation.isPending}
                onClick={() =>
                  router.push("/dashboard/settings")
                }
              >
                <Settings className="mr-2 h-4 w-4" />
                {t("settings")}
              </DropdownMenuItem>

              <DropdownMenuItem
                disabled={logoutMutation.isPending}
              >
                <Bell className="mr-2 h-4 w-4" />
                {t("notifications")}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              disabled={logoutMutation.isPending}
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />

              {logoutMutation.isPending
                ? "Logging out..."
                : t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}