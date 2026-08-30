import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

type BaseModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
};

export function BaseModal({
  open,
  onOpenChange,
  title,
  children,
}: BaseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[95vw]
          sm:w-[90vw]
          md:max-w-2xl
          lg:max-w-2xl
          xl:max-w-3xl
          max-h-[90vh]
          overflow-hidden
          flex
          flex-col
        "
      >
        {/* HEADER */}
        <DialogHeader className="shrink-0 border-b pb-3">
          <DialogTitle className="text-base md:text-lg">
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* CONTENT AREA (SCROLLABLE) */}
        <div className="flex-1  pr-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}