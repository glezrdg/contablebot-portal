/**
 * InvoiceUploader Component
 *
 * Multi-image upload UI with drag & drop, camera capture, preview, and OCR processing.
 */

import { useState, useRef } from "react";
import {
  Upload,
  X,
  FileImage,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  FolderOpen,
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
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
  const MAX_FILES = 20; // 20 files max per upload (supports ~20 concurrent users)

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];

    const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    Array.from(selectedFiles).forEach((file) => {
      // Check file type (no GIF)
      const isValidImage = validImageTypes.includes(file.type);
      const isPDF = file.type === "application/pdf";

      if (!isValidImage && !isPDF) {
        errors.push(`${file.name}: Tipo de archivo no soportado. Solo JPG, PNG, WEBP, PDF`);
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        errors.push(`${file.name}: Archivo muy grande (${sizeMB}MB). Máximo 5MB`);
        return;
      }

      // Check max files limit
      if (files.length + validFiles.length >= MAX_FILES) {
        errors.push(`${file.name}: Límite de ${MAX_FILES} archivos alcanzado`);
        return;
      }

      validFiles.push({
        file,
        preview: file.type === "application/pdf"
          ? "/pdf-icon.svg"
          : URL.createObjectURL(file),
        status: "pending" as const,
      });
    });

    if (errors.length > 0) {
      alert(`Algunos archivos no se pudieron agregar:\n\n${errors.join("\n")}`);
    }

    if (validFiles.length > 0) {
      setFiles([...files, ...validFiles]);
    }
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

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
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
    <div className="space-y-6">
      {/* Active Client Info - Glassmorphic */}
      {activeClientName ? (
        <div className="bg-[var(--glass-white)] backdrop-blur-md border border-primary/30 rounded-2xl p-5 shadow-[0_8px_24px_0_rgba(59,130,246,0.15)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-primary/10 before:to-transparent before:pointer-events-none before:z-[-1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center shadow-md">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Subiendo facturas para
              </p>
              <p className="text-sm font-bold text-foreground">{activeClientName}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-destructive/10 backdrop-blur-sm border border-destructive/30 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive">
              Debes seleccionar un cliente antes de subir facturas
            </p>
          </div>
        </div>
      )}

      {/* Upload Options - Two Buttons Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Browse Files Button */}
        <div
          onClick={() => !activeClientName || isUploading ? null : fileInputRef.current?.click()}
          className={`
            group bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-8
            cursor-pointer transition-all duration-300
            shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)]
            dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)]
            hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.25),0_6px_24px_0_rgba(31,38,135,0.15),inset_0_1px_0_0_rgba(255,255,255,0.6)]
            dark:hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.5),0_6px_24px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)]
            hover:translate-y-[-4px]
            relative
            before:absolute before:inset-0 before:rounded-2xl
            before:bg-gradient-to-b before:from-white/20 before:to-transparent
            before:pointer-events-none before:z-[-1]
            ${!activeClientName || isUploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center shadow-[0_4px_16px_rgba(59,130,246,0.2)] group-hover:shadow-[0_6px_24px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-all duration-300">
              <Upload className="w-10 h-10 text-primary drop-shadow-sm" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground mb-1">
                Seleccionar archivos
              </p>
              <p className="text-sm text-muted-foreground">
                JPG, PNG, WEBP, PDF
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={!activeClientName || isUploading}
          />
        </div>

        {/* Camera Capture Button */}
        <div
          onClick={() => !activeClientName || isUploading ? null : handleCameraCapture()}
          className={`
            group bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl p-8
            cursor-pointer transition-all duration-300
            shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)]
            dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)]
            hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.25),0_6px_24px_0_rgba(31,38,135,0.15),inset_0_1px_0_0_rgba(255,255,255,0.6)]
            dark:hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.5),0_6px_24px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)]
            hover:translate-y-[-4px]
            relative
            before:absolute before:inset-0 before:rounded-2xl
            before:bg-gradient-to-b before:from-white/20 before:to-transparent
            before:pointer-events-none before:z-[-1]
            ${!activeClientName || isUploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 flex items-center justify-center shadow-[0_4px_16px_rgba(16,185,129,0.2)] group-hover:shadow-[0_6px_24px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-all duration-300">
              <Camera className="w-10 h-10 text-emerald-500 drop-shadow-sm" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground mb-1">
                Tomar foto
              </p>
              <p className="text-sm text-muted-foreground">
                Usa tu cámara
              </p>
            </div>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={!activeClientName || isUploading}
          />
        </div>
      </div>

      {/* Drag & Drop Zone - Optional Alternative */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`
          border-2 border-dashed rounded-2xl p-6
          transition-all duration-300
          bg-[var(--glass-white)] backdrop-blur-sm
          ${isDragging
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-[var(--glass-border)] hover:border-primary/50"
          }
          ${!activeClientName ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <p className="text-center text-sm text-muted-foreground">
          O arrastra archivos aquí (máx. 20 archivos, 5MB cada uno)
        </p>
      </div>

      {/* File Previews - Glassmorphic */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <FileImage className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground">
                {files.length} archivo{files.length !== 1 ? "s" : ""} seleccionado
                {files.length !== 1 ? "s" : ""}
              </p>
            </div>
            {files.length > 0 && !isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  files.forEach((f) => URL.revokeObjectURL(f.preview));
                  setFiles([]);
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Limpiar todo
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((fileItem, index) => (
              <div
                key={index}
                className="relative group bg-[var(--glass-white)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl overflow-hidden shadow-[0_4px_16px_0_rgba(31,38,135,0.1)] hover:shadow-[0_8px_24px_0_rgba(31,38,135,0.15)] transition-all duration-300"
              >
                {/* Preview Image */}
                <div className="aspect-square bg-muted/50 relative">
                  <img
                    src={fileItem.preview}
                    alt={fileItem.file.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Status Overlay */}
                  {fileItem.status !== "pending" && (
                    <div
                      className={`
                      absolute inset-0 flex items-center justify-center backdrop-blur-md
                      ${fileItem.status === "success"
                          ? "bg-emerald-500/90"
                          : fileItem.status === "error"
                            ? "bg-destructive/90"
                            : "bg-primary/90"
                        }
                    `}
                    >
                      {fileItem.status === "uploading" && (
                        <Loader2 className="w-8 h-8 text-white animate-spin drop-shadow-md" />
                      )}
                      {fileItem.status === "success" && (
                        <CheckCircle2 className="w-8 h-8 text-white drop-shadow-md" />
                      )}
                      {fileItem.status === "error" && (
                        <AlertCircle className="w-8 h-8 text-white drop-shadow-md" />
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
                      className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-destructive text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg hover:scale-110"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* File Info */}
                <div className="p-3 bg-[var(--glass-white)]/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs text-foreground truncate font-medium">
                      {fileItem.file.name}
                    </p>
                  </div>
                  {fileItem.error && (
                    <p className="text-xs text-destructive mt-1 truncate font-medium">
                      {fileItem.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button - Gradient */}
      {files.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!activeClientName || isUploading || files.length === 0}
            variant="gradient"
            size="lg"
            className="min-w-48 shadow-lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Procesar {files.length} factura{files.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
