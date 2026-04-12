"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { useState } from "react";

interface UploadZoneProps {
  onUploadComplete: (urls: string[]) => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; url: string }[]
  >([]);

  return (
    <div>
      <UploadDropzone
        endpoint="adAssetUploader"
        onClientUploadComplete={(res) => {
          const newFiles = res.map((f) => ({
            name: f.name,
            url: f.ufsUrl,
          }));
          const all = [...uploadedFiles, ...newFiles];
          setUploadedFiles(all);
          onUploadComplete(all.map((f) => f.url));
        }}
        onUploadError={(error) => {
          console.error("Upload error:", error);
        }}
      />
      {uploadedFiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {uploadedFiles.map((file, i) => (
            <div
              key={i}
              className="rounded-md bg-muted px-3 py-1 text-sm text-muted-foreground"
            >
              {file.name}
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Optional -- AI can generate your ad entirely from your description.
      </p>
    </div>
  );
}
