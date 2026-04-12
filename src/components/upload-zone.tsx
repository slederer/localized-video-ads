"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { useState } from "react";
import { Box, Text, HStack, Badge } from "@chakra-ui/react";

interface UploadZoneProps {
  onUploadComplete: (urls: string[]) => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);

  return (
    <Box>
      <UploadDropzone
        endpoint="adAssetUploader"
        onClientUploadComplete={(res) => {
          const newFiles = res.map((f) => ({ name: f.name, url: f.ufsUrl }));
          const all = [...uploadedFiles, ...newFiles];
          setUploadedFiles(all);
          onUploadComplete(all.map((f) => f.url));
        }}
        onUploadError={(error) => console.error("Upload error:", error)}
      />
      {uploadedFiles.length > 0 && (
        <HStack mt="3" flexWrap="wrap" gap="2">
          {uploadedFiles.map((file, i) => (
            <Badge key={i} colorPalette="purple" variant="subtle" borderRadius="full" px="3" py="1">
              {file.name}
            </Badge>
          ))}
        </HStack>
      )}
      <Text mt="2" fontSize="xs" color="gray.400">
        AI can generate your ad entirely from the description. Upload assets only to guide the visual style.
      </Text>
    </Box>
  );
}
