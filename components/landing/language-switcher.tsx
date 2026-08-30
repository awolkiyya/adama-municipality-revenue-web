"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
    return (
        <DropdownMenu>

            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Languages className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuItem>
                    Afaan Oromoo
                </DropdownMenuItem>

                <DropdownMenuItem>
                    English
                </DropdownMenuItem>

                <DropdownMenuItem>
                    አማርኛ
                </DropdownMenuItem>
            </DropdownMenuContent>

        </DropdownMenu>
    );
}