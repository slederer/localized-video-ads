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
        className="rounded-xl border-2 border-dashed border-zinc-200 bg-white hover:border-violet-300 hover:bg-violet-50/30 transition-colors ut-uploading:border-violet-500"
      />
      {uploadedFiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {uploadedFiles.map((file, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              {file.name}
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-zinc-400">
        AI can generate your ad entirely from the description above. Upload assets only if you want to guide the visual style.
      </p>
    </div>
  );
}
