import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
  
  import { Button } from "@/components/ui/button";
  import { Download, FileText, FileSpreadsheet, File } from "lucide-react";
  
  export function ExportDropdown() {
    return (
      <DropdownMenu>
        
        <DropdownMenuTrigger asChild>
          <Button variant="default" className="py-4">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
  
        <DropdownMenuContent align="end" className="w-48">
  
          <DropdownMenuItem>
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </DropdownMenuItem>
  
          <DropdownMenuItem>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </DropdownMenuItem>
  
          <DropdownMenuItem>
            <File className="h-4 w-4 mr-2" />
            Export PDF
          </DropdownMenuItem>
  
        </DropdownMenuContent>
        
      </DropdownMenu>
    );
  }