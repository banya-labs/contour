"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";

// -----------------------------------------------------------------------------
// Status Types
// -----------------------------------------------------------------------------
export type GitStatus = "untracked" | "modified" | "deleted";
export type VaultStatus = "active" | "verified" | "unverified" | "archived" | "uploading" | "locked";

// -----------------------------------------------------------------------------
// Status Indicator Component (Strict Editorial Sharp Styling)
// -----------------------------------------------------------------------------
function StatusIndicator({ 
  gitStatus, 
  vaultStatus 
}: { 
  gitStatus?: GitStatus; 
  vaultStatus?: VaultStatus;
}) {
  if (vaultStatus) {
    switch (vaultStatus) {
      case "verified":
        return (
          <span 
            title="Verified Document" 
            aria-label="Verified Document"
            className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-none border border-emerald-300"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Verified</span>
          </span>
        );
      case "unverified":
        return (
          <span 
            title="Pending Verification" 
            aria-label="Pending Verification"
            className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-none border border-amber-300"
          >
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Pending</span>
          </span>
        );
      case "archived":
      case "locked":
        return (
          <span 
            title="Archived & Locked (Read-Only)" 
            aria-label="Archived & Locked (Read-Only)"
            className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-editorial-muted bg-neutral-100 px-1.5 py-0.5 rounded-none border border-editorial-border"
          >
            <Lock className="w-3 h-3 text-editorial-muted" />
            <span>Read-Only</span>
          </span>
        );
      case "uploading":
        return (
          <span 
            title="Uploading" 
            aria-label="Uploading"
            className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-contour-red bg-[#fff5f3] px-1.5 py-0.5 rounded-none border border-contour-red/30"
          >
            <ContourSunLoader size="sm" label="Syncing document…" decorative />
            <span>Syncing</span>
          </span>
        );
      case "active":
      default:
        return (
          <span 
            title="Active" 
            aria-label="Active"
            className="w-1.5 h-1.5 rounded-none bg-contour-red shrink-0" 
          />
        );
    }
  }

  if (gitStatus) {
    switch (gitStatus) {
      case "untracked":
        return (
          <span 
            title="Untracked" 
            aria-label="Untracked"
            className="text-[10px] font-mono font-bold text-emerald-600 px-1 border border-emerald-300 bg-emerald-50 rounded-none"
          >
            U
          </span>
        );
      case "modified":
        return (
          <span 
            title="Modified" 
            aria-label="Modified"
            className="text-[10px] font-mono font-bold text-amber-600 px-1 border border-amber-300 bg-amber-50 rounded-none"
          >
            M
          </span>
        );
      case "deleted":
        return (
          <span 
            title="Deleted" 
            aria-label="Deleted"
            className="text-[10px] font-mono font-bold text-red-600 px-1 border border-red-300 bg-red-50 rounded-none"
          >
            D
          </span>
        );
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Files Root Component
// -----------------------------------------------------------------------------
export interface FilesProps {
  children: React.ReactNode;
  defaultOpen?: string[];
  open?: string[];
  onOpenChange?: (open: string[]) => void;
  className?: string;
}

export function Files({
  children,
  defaultOpen = [],
  open,
  onOpenChange,
  className,
}: FilesProps) {
  return (
    <AccordionPrimitive.Root
      type="multiple"
      defaultValue={defaultOpen}
      value={open}
      onValueChange={onOpenChange}
      className={cn("w-full select-none space-y-1 font-geist text-xs text-editorial-black", className)}
    >
      {children}
    </AccordionPrimitive.Root>
  );
}

// -----------------------------------------------------------------------------
// FolderItem Component
// -----------------------------------------------------------------------------
export interface FolderItemProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  value: string;
  isArchived?: boolean;
}

export const FolderItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  FolderItemProps
>(({ className, isArchived, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "border border-transparent rounded-none transition-colors",
      isArchived && "opacity-75 bg-neutral-50 border-dashed border-editorial-border",
      className
    )}
    {...props}
  />
));
FolderItem.displayName = "FolderItem";

// -----------------------------------------------------------------------------
// FolderTrigger Component
// -----------------------------------------------------------------------------
export interface FolderTriggerProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  gitStatus?: GitStatus;
  vaultStatus?: VaultStatus;
  badgeCount?: number;
  actions?: React.ReactNode;
}

export const FolderTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  FolderTriggerProps
>(({ className, children, gitStatus, vaultStatus, badgeCount, actions, ...props }, ref) => {
  return (
    <AccordionPrimitive.Header className="flex items-center justify-between w-full group border border-transparent hover:border-editorial-border bg-white transition-colors">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center gap-2 px-3 py-2 text-left text-xs font-heading font-medium text-editorial-black uppercase tracking-wider",
          "hover:bg-[#fff5f3] rounded-none transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-editorial-black",
          "[&[data-state=open]>svg.folder-closed]:hidden [&[data-state=open]>svg.folder-open]:block",
          "[&[data-state=closed]>svg.folder-closed]:block [&[data-state=closed]>svg.folder-open]:hidden",
          "[&[data-state=open]>svg.chevron]:rotate-90",
          className
        )}
        {...props}
      >
        <ChevronRight className="chevron w-3.5 h-3.5 shrink-0 text-editorial-muted transition-transform duration-200" />
        <Folder className="folder-closed w-4 h-4 shrink-0 text-editorial-black fill-editorial-black/10" />
        <FolderOpen className="folder-open hidden w-4 h-4 shrink-0 text-contour-red fill-contour-red/20" />
        
        <span className="flex-1 truncate">{children}</span>

        {typeof badgeCount === "number" && (
          <span className="text-[10px] font-mono text-editorial-muted bg-neutral-100 border border-editorial-border px-1.5 py-0.2 rounded-none">
            {badgeCount}
          </span>
        )}

        <StatusIndicator gitStatus={gitStatus} vaultStatus={vaultStatus} />
      </AccordionPrimitive.Trigger>

      {actions && (
        <div 
          className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity px-2"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </AccordionPrimitive.Header>
  );
});
FolderTrigger.displayName = "FolderTrigger";

// -----------------------------------------------------------------------------
// FolderContent Component
// -----------------------------------------------------------------------------
export const FolderContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className
    )}
    {...props}
  >
    <div className="pt-0.5 pb-1">{children}</div>
  </AccordionPrimitive.Content>
));
FolderContent.displayName = "FolderContent";

// -----------------------------------------------------------------------------
// SubFiles Component (Nested container with sharp ruled tree guide line)
// -----------------------------------------------------------------------------
export function SubFiles({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ml-3.5 pl-3 border-l border-editorial-border space-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}

// -----------------------------------------------------------------------------
// FileItem Component
// -----------------------------------------------------------------------------
export interface FileItemProps extends React.ComponentPropsWithoutRef<"div"> {
  icon?: React.ElementType;
  gitStatus?: GitStatus;
  vaultStatus?: VaultStatus;
  classification?: string;
  size?: string;
  actions?: React.ReactNode;
  disabled?: boolean;
}

export const FileItem = React.forwardRef<HTMLDivElement, FileItemProps>(
  (
    {
      className,
      children,
      icon: Icon = FileText,
      gitStatus,
      vaultStatus,
      classification,
      size,
      actions,
      disabled = false,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        onClick={disabled ? undefined : onClick}
        className={cn(
          "group flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-none border border-transparent hover:border-editorial-border transition-colors",
          disabled 
            ? "opacity-50 cursor-not-allowed text-editorial-muted" 
            : "text-editorial-black hover:bg-[#fff5f3] cursor-pointer",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Icon className="w-3.5 h-3.5 shrink-0 text-editorial-muted group-hover:text-contour-red transition-colors" />
          <span className="truncate">{children}</span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {classification && (
            <span className="hidden sm:inline-block text-[10px] font-mono text-editorial-muted uppercase px-1.5 py-0.2 border border-editorial-border bg-neutral-50 rounded-none">
              {classification.replace("_", " ")}
            </span>
          )}

          {size && (
            <span className="text-[10px] font-mono text-editorial-muted">
              {size}
            </span>
          )}

          <StatusIndicator gitStatus={gitStatus} vaultStatus={vaultStatus} />

          {actions && (
            <div 
              className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  }
);
FileItem.displayName = "FileItem";

export default Files;
