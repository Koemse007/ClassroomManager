import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Loader2 } from "lucide-react";

interface FilePreviewProps {
  fileUrl: string;
  fileName?: string;
}

export function FilePreview({ fileUrl, fileName }: FilePreviewProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getFileType = (url: string) => {
    const extension = url.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(extension)) return "pdf";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
    return "unknown";
  };

  const fileType = getFileType(fileUrl);
  const name = fileName || fileUrl.split("/").pop() || "File";

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setIsLoading(true);
    }
    setOpen(newOpen);
  };

  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleOpenChange(true)}
        data-testid="button-preview-file"
        className="gap-2"
      >
        <Eye className="h-4 w-4" />
        Preview
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate">{name}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/50 rounded-lg min-h-[400px] relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {fileType === "pdf" && (
              <iframe
                src={`${fileUrl}#toolbar=0`}
                className="w-full h-full rounded-lg"
                title={name}
                onLoad={handleLoadComplete}
              />
            )}

            {fileType === "image" && (
              <img
                src={fileUrl}
                alt={name}
                className="max-w-full max-h-full object-contain"
                onLoad={handleLoadComplete}
              />
            )}

            {fileType === "unknown" && (
              <div className="text-center text-muted-foreground">
                <p className="mb-2">Preview not available for this file type</p>
                <a href={fileUrl} download>
                  <Button variant="outline">Download instead</Button>
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
