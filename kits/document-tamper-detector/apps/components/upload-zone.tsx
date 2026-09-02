"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, ImageIcon, X, AlertCircle } from "lucide-react"

interface UploadZoneProps {
  onFileReady: (fileBase64: string, fileName: string, fileType: string) => void
  disabled?: boolean
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
}

const MAX_SIZE_MB = 10

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function UploadZone({ onFileReady, disabled }: UploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string>("")
  const [converting, setConverting] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError("")

      if (rejectedFiles.length > 0) {
        const rej = rejectedFiles[0]
        if (rej.errors?.[0]?.code === "file-too-large") {
          setError(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`)
        } else if (rej.errors?.[0]?.code === "file-invalid-type") {
          setError("Unsupported file type. Please upload a PDF, JPEG, or PNG.")
        } else {
          setError("File rejected. Please try a different file.")
        }
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      setSelectedFile(file)
      setConverting(true)

      try {
        const base64 = await fileToBase64(file)
        onFileReady(base64, file.name, file.type)
      } catch {
        setError("Failed to read file. Please try again.")
      } finally {
        setConverting(false)
      }
    },
    [onFileReady]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
    multiple: false,
    disabled: disabled || converting,
  })

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(null)
    setError("")
  }

  const isPdf = selectedFile?.type === "application/pdf"
  const isImage = selectedFile?.type?.startsWith("image/")

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`
          relative group cursor-pointer rounded-2xl border-2 border-dashed p-10 transition-all duration-300 select-none
          ${isDragActive && !isDragReject ? "border-amber-400 bg-amber-400/5 scale-[1.01]" : ""}
          ${isDragReject ? "border-red-500 bg-red-500/5" : ""}
          ${!isDragActive && !isDragReject && !selectedFile ? "border-slate-700 hover:border-amber-500/60 hover:bg-amber-500/5 bg-slate-900/50" : ""}
          ${selectedFile && !isDragActive ? "border-slate-700 bg-slate-900/30" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} id="document-upload" />

        {/* Glow effect on drag */}
        {isDragActive && !isDragReject && (
          <div className="absolute inset-0 rounded-2xl bg-amber-400/10 blur-xl pointer-events-none" />
        )}

        {selectedFile ? (
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
              ${isPdf ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"}`}>
              {isPdf ? <FileText className="w-7 h-7" /> : <ImageIcon className="w-7 h-7" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{selectedFile.name}</p>
              <p className="text-slate-400 text-sm mt-0.5">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · {selectedFile.type}
              </p>
              {converting && (
                <p className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Converting to base64…
                </p>
              )}
            </div>
            <button
              onClick={clearFile}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-amber-500/10 transition-colors">
              <Upload className={`w-7 h-7 transition-colors ${isDragActive ? "text-amber-400" : "text-slate-500 group-hover:text-amber-400"}`} />
            </div>
            <p className="text-white font-medium mb-1">
              {isDragActive ? "Drop it here!" : "Drop your document here"}
            </p>
            <p className="text-slate-400 text-sm">
              or <span className="text-amber-400 underline underline-offset-2">browse files</span>
            </p>
            <p className="text-slate-600 text-xs mt-3">
              PDF, JPEG, PNG · Max {MAX_SIZE_MB}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
