"use client";

import { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFile: (file: File) => void;
}

export default function FileUpload({ onFile }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        onFile(file);
      }
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-200 cursor-pointer group max-w-xl mx-auto",
        isDragging
          ? "border-sky-500 bg-sky-500/10 scale-[1.02]"
          : "border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-800/50"
      )}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleChange}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
      />
      <div className="flex flex-col items-center gap-4 pointer-events-none">
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
            isDragging ? "bg-sky-500/20" : "bg-slate-800 group-hover:bg-slate-700"
          )}
        >
          {isDragging ? (
            <FileText className="w-8 h-8 text-sky-400" />
          ) : (
            <Upload className="w-8 h-8 text-slate-400 group-hover:text-sky-400 transition-colors" />
          )}
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">
            {isDragging ? "Drop your CSV here" : "Upload your CSV file"}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Drag & drop or click to browse · CSV files only
          </p>
        </div>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="bg-slate-800 px-2 py-1 rounded">Titanic.csv</span>
          <span className="bg-slate-800 px-2 py-1 rounded">housing.csv</span>
          <span className="bg-slate-800 px-2 py-1 rounded">iris.csv</span>
        </div>
      </div>
    </div>
  );
}
