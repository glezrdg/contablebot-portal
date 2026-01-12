/**
 * InvoiceUploader Component
 *
 * Multi-image upload UI with drag & drop, preview, and OCR processing.
 */

import { useState, useRef } from "react";
import {
  Upload,
  X,
  FileImage,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  invoiceId?: number;
}

interface InvoiceUploaderProps {
  activeClientName?: string;
  onUploadComplete: (totalUploaded: number) => void;
}

export default function InvoiceUploader({
  activeClientName,
  onUploadComplete,
}: InvoiceUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 10 - files.length) // Max 10 total
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        status: "pending" as const,
      }));

    setFiles([...files, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    const newFiles = [...files];
    URL.revokeObjectURL(newFiles[index].preview); // Clean up preview URL
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    // Create FormData
    const formData = new FormData();
    files.forEach((fileItem) => {
      formData.append("images", fileItem.file);
    });

    try {
      const response = await fetch("/api/invoices/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al subir las facturas");
      }

      const result = await response.json();

      // Update file statuses based on response
      const updatedFiles = files.map((fileItem, index) => {
        const uploadResult = result.invoices[index];
        return {
          ...fileItem,
          status: uploadResult.success
            ? ("success" as const)
            : ("error" as const),
          error: uploadResult.error,
          invoiceId: uploadResult.id,
        };
      });

      setFiles(updatedFiles);
      onUploadComplete(result.totalUploaded);

      // Auto-clear successful uploads after 3 seconds
      setTimeout(() => {
        setFiles((current) => current.filter((f) => f.status === "error"));
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        error instanceof Error ? error.message : "Error al subir las facturas"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Active Client Info */}
      {activeClientName ? (
        <div className="bg-primary/20 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-foreground">
            📂 Subiendo facturas para:{" "}
            <span className="font-semibold">{activeClientName}</span>
          </p>
        </div>
      ) : (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">
            ⚠️ Debes seleccionar un cliente antes de subir facturas
          </p>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-5
          cursor-pointer transition-all
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }
          ${!activeClientName ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>

          <div>
            <p className="text-lg font-medium text-foreground mb-1">
              Arrastra imágenes aquí o haz click para seleccionar
            </p>
            <p className="text-sm text-muted-foreground">
              Soporta JPG, PNG, WEBP, GIF (máx. 10 archivos, 10MB cada uno)
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={!activeClientName || isUploading}
        />
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {files.length} archivo{files.length !== 1 ? "s" : ""} seleccionado
              {files.length !== 1 ? "s" : ""}
            </p>
            {files.length > 0 && !isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  files.forEach((f) => URL.revokeObjectURL(f.preview));
                  setFiles([]);
                }}
                className="text-destructive hover:text-destructive"
              >
                Limpiar todo
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((fileItem, index) => (
              <div
                key={index}
                className="relative group border border-border rounded-lg overflow-hidden bg-card"
              >
                {/* Preview Image */}
                <div className="aspect-square bg-muted relative">
                  <img
                    src={fileItem.preview}
                    alt={fileItem.file.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Status Overlay */}
                  {fileItem.status !== "pending" && (
                    <div
                      className={`
                      absolute inset-0 flex items-center justify-center
                      ${
                        fileItem.status === "success"
                          ? "bg-green-500/90"
                          : fileItem.status === "error"
                          ? "bg-destructive/90"
                          : "bg-primary/90"
                      }
                    `}
                    >
                      {fileItem.status === "uploading" && (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      )}
                      {fileItem.status === "success" && (
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      )}
                      {fileItem.status === "error" && (
                        <AlertCircle className="w-8 h-8 text-white" />
                      )}
                    </div>
                  )}

                  {/* Remove Button */}
                  {!isUploading && fileItem.status === "pending" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(index);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* File Info */}
                <div className="p-2">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs text-foreground truncate">
                      {fileItem.file.name}
                    </p>
                  </div>
                  {fileItem.error && (
                    <p className="text-xs text-destructive mt-1 truncate">
                      {fileItem.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!activeClientName || isUploading || files.length === 0}
            className="min-w-40"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              `Procesar ${files.length} factura${files.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
