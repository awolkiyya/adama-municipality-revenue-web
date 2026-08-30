"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  LogOut,
  MapPin,
  Phone,
  ShieldCheck,
  Mail,
  CalendarDays,
  Building2,
  BriefcaseBusiness,
} from "lucide-react";

import { useSelector } from "react-redux";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { DataRow, IconTile, SectionCard } from "../primitives";
import { formatDate, getInitials } from "../utils";

import type { RootState } from "@/lib/store/store";
import { useLogout } from "@/hooks/auth/useLogout";

export function ProfilePanel() {
  const user = useSelector((state: RootState) => state.auth.user);

  /**
   * ---------------------------------------------------------------
   * LOGOUT
   * ---------------------------------------------------------------
   *
   * Same hook + guard pattern used in NavUser, so behavior stays
   * consistent across the sidebar and this profile page.
   */
  const logoutMutation = useLogout();

  const handleLogout = () => {
    if (logoutMutation.isPending) {
      return;
    }

    logoutMutation.mutate();
  };

  /**
   * ---------------------------------------------------------------
   * AUTH USER GUARD
   * ---------------------------------------------------------------
   *
   * The profile page depends on the authenticated user.
   * If auth is still loading or the user is not available,
   * don't try to access nested properties.
   */
  if (!user) {
    return (
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <Card className="rounded-[20px] border-[var(--galii-border)]">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-[76px] w-[76px] rounded-full bg-[var(--galii-surface-muted)] animate-pulse" />

            <div className="mt-4 h-5 w-32 rounded bg-[var(--galii-surface-muted)] animate-pulse" />

            <div className="mt-2 h-4 w-24 rounded bg-[var(--galii-surface-muted)] animate-pulse" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <ProfileSkeleton />
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  /**
   * ---------------------------------------------------------------
   * CITIZEN PROFILE
   * ---------------------------------------------------------------
   *
   * Citizens have their detailed information inside:
   *
   * user.citizen
   */
  const citizen = user.citizen;

  /**
   * For citizen accounts this should normally exist.
   * However, keeping the guard makes the component safe if the
   * backend returns an incomplete user object.
   */
  if (!citizen) {
    return (
      <Card className="rounded-[20px] border-[var(--galii-border)]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[var(--galii-danger)]" />

            <div>
              <p className="font-semibold">
                Citizen profile unavailable
              </p>

              <p className="text-sm text-[var(--galii-text-muted)] mt-1">
                Your authenticated account does not contain a citizen
                profile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * ---------------------------------------------------------------
   * DERIVED VALUES
   * ---------------------------------------------------------------
   */

  const fullName = citizen.full_name || user.name || "Citizen";

  const initials = getInitials(fullName);

  const phone =  user.phone || "Not provided";

  const address = citizen.address || "Not provided";

  const administrativeUnit = user.administrative_unit;

  const sector = user.sector;

  const isActive = user.is_active;

  const citizenId = citizen.citizen_uid || "Not available";

  const nationalId = citizen.national_id || "Not provided";

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      {/* ============================================================
          PROFILE SUMMARY
      ============================================================ */}
      <Card
        className="
          rounded-[20px]
          border-[var(--galii-border)]
          h-fit
          galii-card-in
        "
      >
        <CardContent className="p-6 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative">
            <div
              className="
                absolute
                -inset-2
                rounded-full
                opacity-40
              "
              style={{
                background:
                  "repeating-conic-gradient(var(--galii-gold) 0deg 4deg, transparent 4deg 12deg)",
              }}
            />

            <Avatar className="h-[76px] w-[76px] shadow-lg relative">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={fullName}
                  className="h-full w-full object-cover rounded-full"
                />
              )}

              <AvatarFallback
                className="
                  text-[27px]
                  font-bold
                  text-[var(--galii-primary-dark)]
                "
                style={{
                  background:
                    "linear-gradient(160deg, var(--galii-gold-light), var(--galii-gold))",
                }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name */}
          <p className="font-bold text-[16.5px] mt-4 galii-serif">
            {fullName}
          </p>

          {/* Account type */}
          <p className="text-[12px] text-[var(--galii-text-muted)] mt-0.5">
            {user.user_type === "citizen"
              ? "Registered citizen"
              : "System user"}
          </p>

          {/* Status */}
          <span
            className={`
              mt-3
              inline-flex
              items-center
              gap-1.5
              px-2.5
              py-1
              rounded-full
              text-[11px]
              font-semibold

              ${
                isActive
                  ? "bg-[var(--galii-success-bg)] text-[var(--galii-success)]"
                  : "bg-[var(--galii-surface-muted)] text-[var(--galii-text-muted)]"
              }
            `}
          >
            <ShieldCheck className="h-3 w-3" />

            {isActive ? "Active" : "Inactive"}
          </span>

          {/* Citizen ID */}
          <div className="mt-4 pt-4 border-t border-[var(--galii-border)] w-full">
            <p className="text-[10px] uppercase tracking-wide font-semibold text-[var(--galii-text-faint)]">
              Citizen ID
            </p>

            <p className="text-[12px] font-semibold font-mono mt-1">
              {citizenId}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================
          PROFILE DETAILS
      ============================================================ */}
      <div className="space-y-4">
        {/* ==========================================================
            PERSONAL INFORMATION
        ========================================================== */}
        <SectionCard title="Personal information">
          <DataRow
            label="Citizen ID"
            value={citizenId}
            mono
          />

          <DataRow
            label="Full name"
            value={fullName}
          />

          <DataRow
            label="National ID"
            value={nationalId}
            mono
          />

          <DataRow
            label="Gender"
            value={citizen.gender}
          />

          <DataRow
            label="Date of birth"
            value={
              citizen.date_of_birth
                ? formatDate(citizen.date_of_birth)
                : "Not provided"
            }
          />


          <DataRow
            label="Address"
            value={address}
            last
          />
        </SectionCard>

        {/* ==========================================================
            ACCOUNT INFORMATION
        ========================================================== */}
        <SectionCard title="Account information">
          <DataRow
            label="Account name"
            value={user.name || "Not provided"}
          />

          <DataRow
            label="Email"
            value={user.email || "Not provided"}
          />

          <DataRow
            label="Phone"
            value={user.phone || "Not provided"}
            mono
          />

          <DataRow
            label="Account type"
            value={user.user_type}
          />

          <DataRow
            label="Account status"
            value={user.is_active ? "Active" : "Inactive"}
            last
          />
        </SectionCard>


        {/* ==========================================================
            CONTACT & LOCATION
        ========================================================== */}
        <SectionCard title="Contact & location">
          <ContactRow
            icon={Phone}
            label="Phone"
            value={phone}
          />

          <ContactRow
            icon={Mail}
            label="Email"
            value={user.email || "Not provided"}
          />

          <ContactRow
            icon={MapPin}
            label="Address"
            value={address}
          />

          <ContactRow
            icon={Building2}
            label="Administrative unit"
            value={
              administrativeUnit?.name ||
              "Not assigned"
            }
            last
          />
        </SectionCard>

        {/* ==========================================================
            ACCOUNT DATES
        ========================================================== */}
        <SectionCard title="Account history">
          <ContactRow
            icon={CalendarDays}
            label="Registered"
            value={
              user.createdAt
                ? formatDate(user.createdAt)
                : user.created_at
                  ? formatDate(user.created_at)
                  : "Not available"
            }
          />

          <ContactRow
            icon={CalendarDays}
            label="Last login"
            value={
              user.lastLoginAt
                ? formatDate(user.lastLoginAt)
                : "Not available"
            }
          />

          <ContactRow
            icon={ShieldCheck}
            label="Phone verification"
            value={
              user.is_phone_verified
                ? "Verified"
                : "Not verified"
            }
            last
          />
        </SectionCard>

        {/* ==========================================================
            SETTINGS
        ========================================================== */}
        <SectionCard title="Settings">
          <MenuRow
            icon={Globe}
            label="Language · Oromiffa"
          />

          <MenuRow
            icon={Bell}
            label="Notification preferences"
          />

          <MenuRow
            icon={HelpCircle}
            label="Help & support"
          />

          <MenuRow
            icon={LogOut}
            label={
              logoutMutation.isPending
                ? "Logging out..."
                : "Log out"
            }
            danger
            noChevron
            last
            disabled={logoutMutation.isPending}
            onClick={handleLogout}
          />
        </SectionCard>
      </div>
    </div>
  );
}

/* =====================================================================
   CONTACT ROW
===================================================================== */

function ContactRow({
  icon,
  label,
  value,
  last,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`
        flex
        items-center
        gap-3
        py-3

        ${
          !last
            ? "border-b border-[var(--galii-border)]"
            : ""
        }
      `}
    >
      <IconTile
        icon={icon}
        size={8}
      />

      <div className="min-w-0">
        <p className="text-[10.5px] text-[var(--galii-text-faint)]">
          {label}
        </p>

        <p className="text-[12.5px] font-semibold mt-0.5 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =====================================================================
   SETTINGS MENU ROW
===================================================================== */

function MenuRow({
  icon,
  label,
  last,
  danger,
  noChevron,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  last?: boolean;
  danger?: boolean;
  noChevron?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        galii-nav-btn
        w-full
        flex
        items-center
        gap-3
        py-3.5
        text-left

        ${
          !last
            ? "border-b border-[var(--galii-border)]"
            : ""
        }

        hover:bg-[var(--galii-surface-muted)]
        rounded-lg
        px-1

        disabled:opacity-60
        disabled:cursor-not-allowed
      `}
    >
      <IconTile
        icon={icon}
        tone={danger ? "danger" : "primary"}
        size={8}
      />

      <span
        className={`
          flex-1
          text-[13px]
          font-medium

          ${
            danger
              ? "text-[var(--galii-danger)]"
              : ""
          }
        `}
      >
        {label}
      </span>

      {!noChevron && (
        <ChevronRight
          className="
            h-4
            w-4
            text-[var(--galii-text-faint)]
          "
        />
      )}
    </button>
  );
}

/* =====================================================================
   PROFILE SKELETON
===================================================================== */

function ProfileSkeleton() {
  return (
    <Card className="rounded-[20px] border-[var(--galii-border)]">
      <CardContent className="p-5 space-y-4">
        <div className="h-5 w-40 rounded bg-[var(--galii-surface-muted)] animate-pulse" />

        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-[var(--galii-surface-muted)] animate-pulse" />
          <div className="h-4 w-4/5 rounded bg-[var(--galii-surface-muted)] animate-pulse" />
          <div className="h-4 w-3/5 rounded bg-[var(--galii-surface-muted)] animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}