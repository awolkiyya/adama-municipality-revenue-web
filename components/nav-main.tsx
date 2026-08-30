"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

import { NavItem } from "@/types/commen";
import { usePermission } from "@/hooks/usePermission";

/* =========================================================
   FONT SCALE
========================================================= */

const font = {
  label: "text-xs",
  item: "text-sm",
  sub: "text-xs sm:text-sm",
};

/* =========================================================
   STYLES
========================================================= */

const styles = {
  itemButton: `
    group relative
    h-11 sm:h-12
    px-2.5 sm:px-3
    border-0 border-l-[3px] border-transparent
    bg-transparent
    rounded-none
    text-white
    transition-all duration-300 ease-in-out
    hover:bg-white/10
    hover:translate-x-0.5
    hover:border-l-white

    data-[active=true]:bg-white/15
    data-[active=true]:text-white
    data-[active=true]:border-l-white

    [&[data-state=open]]:bg-white/10
    [&[data-state=open]]:text-white

    group-data-[collapsible=icon]:justify-center
    group-data-[collapsible=icon]:!px-0
    group-data-[collapsible=icon]:!size-10
    group-data-[collapsible=icon]:mx-auto
  `,

  itemLink: `
    flex items-center gap-2.5 sm:gap-3 w-full
    group-data-[collapsible=icon]:justify-center
    group-data-[collapsible=icon]:gap-0
  `,

  iconWrap: `
    flex items-center justify-center shrink-0
    size-8 sm:size-9
    bg-white/10
    rounded-sm
    transition-all duration-300
    group-hover:bg-white/20

    group-data-[collapsible=icon]:size-8
  `,

  icon: `
    size-4 sm:size-[18px]
    text-white
  `,

  title: `
    truncate
    ${font.item}
    font-semibold
    tracking-tight
    text-white
    group-data-[collapsible=icon]:hidden
  `,

  subTitle: `
    truncate
    ${font.sub}
    font-medium
    text-white
  `,

  chevron: `
    ml-auto
    size-4
    text-white/60
    transition-transform
    duration-300
    group-data-[state=open]/collapsible:rotate-90
    group-data-[collapsible=icon]:hidden
  `,

  subButton: `
    h-9 px-3
    border-l-2 border-transparent
    text-white/70
    transition-all duration-300 ease-in-out
    hover:bg-white/15
    hover:text-white
    hover:border-l-white/50

    data-[active=true]:border-l-white
    data-[active=true]:bg-white/20
    data-[active=true]:text-white
  `,

  groupLabel: `
    mb-2 px-3
    ${font.label}
    font-semibold uppercase tracking-[0.15em]
    text-white/60
    group-data-[collapsible=icon]:hidden
  `,
};

/* =========================================================
   COMPONENT
========================================================= */

export function NavMain({
  items,
}: {
  items: NavItem[];
}) {
  const t = useTranslations("navigation");
  const pathname = usePathname();

  const { can } = usePermission();

  /* =======================================================
     TRANSLATION
  ======================================================= */

  const translate = (key: string) => {
    if (t.has(key)) {
      return t(key);
    }

    return key.replaceAll("_", " ");
  };

  /* =======================================================
     PERMISSION CHECK
     
     A navigation item without a permission is public
     within the authenticated application.

     An item with a permission is displayed only when
     the current user has that permission.
  ======================================================= */

  const hasPermission = (item: NavItem): boolean => {
    if (!item.permission) {
      return true;
    }

    return can(
      item.permission.resource,
      item.permission.action
    );
  };

  /* =======================================================
     FILTER NAVIGATION TREE
     
     Important:
     - Child permissions are checked individually.
     - Parent permission is checked if it has one.
     - Parent with children remains visible if at least
       one child is accessible.
     - Parent with no accessible children is hidden.
  ======================================================= */

  const filterItems = (source: NavItem[]): NavItem[] => {
    return source.reduce<NavItem[]>((result, item) => {
      /* ---------------------------------------------------
         Filter children recursively
      --------------------------------------------------- */

      const filteredChildren = item.items
        ? filterItems(item.items)
        : [];

      const hasChildren = filteredChildren.length > 0;

      /* ---------------------------------------------------
         Check parent's own permission
         
         If parent has children, its permission is treated
         as an additional restriction.
      --------------------------------------------------- */

      const parentAllowed = hasPermission(item);

      /* ---------------------------------------------------
         Parent with children
      --------------------------------------------------- */

      if (item.items?.length) {
        /*
         * If the parent itself requires permission and
         * the user does not have it, hide the entire tree.
         */
        if (item.permission && !parentAllowed) {
          return result;
        }

        /*
         * Parent is allowed, but none of its children are.
         */
        if (!hasChildren) {
          return result;
        }

        result.push({
          ...item,
          items: filteredChildren,
        });

        return result;
      }

      /* ---------------------------------------------------
         Leaf item
      --------------------------------------------------- */

      if (parentAllowed) {
        result.push(item);
      }

      return result;
    }, []);
  };

  const filteredItems = filterItems(items);

  /* =======================================================
     ACTIVE URL
  ======================================================= */

  const isUrlActive = (url?: string) => {
    if (!url) {
      return false;
    }

    return pathname === url;
  };

  /* =======================================================
     PARENT ACTIVE STATE
  ======================================================= */

  const isParentActive = (item: NavItem): boolean => {
    if (isUrlActive(item.url)) {
      return true;
    }

    return !!item.items?.some((subItem) =>
      isParentActive(subItem)
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <SidebarGroup className="px-1.5 py-2 sm:px-1 sm:py-3">
      <SidebarGroupLabel className={styles.groupLabel}>
        {t("platform")}
      </SidebarGroupLabel>

      <SidebarMenu className="space-y-1 sm:space-y-1.5">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.items?.length;

          /* =================================================
             PARENT WITH CHILDREN
          ================================================= */

          if (hasChildren) {
            const parentActive = isParentActive(item);

            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={ parentActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={translate(item.title)}
                      className={styles.itemButton}
                      data-active={parentActive}
                    >
                      {Icon && (
                        <div className={styles.iconWrap}>
                          <Icon className={styles.icon} />
                        </div>
                      )}

                      <span className={styles.title}>
                        {translate(item.title)}
                      </span>

                      <ChevronRight className={styles.chevron} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="overflow-hidden group-data-[collapsible=icon]:hidden">
                    <SidebarMenuSub className="mt-2 ml-4 space-y-1 border-l border-white/20 pl-3">
                      {item.items!.map((subItem) => {
                        const subActive = isParentActive(subItem);

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={styles.subButton}
                              data-active={subActive}
                            >
                              <a href={subItem.url}>
                                <span className={styles.subTitle}>
                                  {translate(subItem.title)}
                                </span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          /* =================================================
             LEAF ITEM
          ================================================= */

          const active = isUrlActive(item.url);

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={translate(item.title)}
                className={styles.itemButton}
                data-active={active}
              >
                <a
                  href={item.url}
                  className={styles.itemLink}
                >
                  {Icon && (
                    <div className={styles.iconWrap}>
                      <Icon className={styles.icon} />
                    </div>
                  )}

                  <span className={styles.title}>
                    {translate(item.title)}
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}