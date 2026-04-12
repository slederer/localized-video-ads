"use client";

import { Box, Text, Badge, Spinner } from "@chakra-ui/react";

interface GenerationCardProps {
  provider: string;
  status: string;
  videoUrl?: string | null;
  errorMessage?: string | null;
  onSelect?: () => void;
  isSelected?: boolean;
}

const PROVIDER_COLORS: Record<string, string> = {
  Luma: "blue",
  Runway: "pink",
  Veo: "green",
  Kling: "orange",
  MiniMax: "purple",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Queued",
  GENERATING: "Generating",
  EXTENDING: "Extending",
  UPLOADING: "Finalizing",
  COMPLETED: "Ready",
  FAILED: "Failed",
};

export function GenerationCard({
  provider,
  status,
  videoUrl,
  errorMessage,
  onSelect,
  isSelected,
}: GenerationCardProps) {
  const isReady = status === "COMPLETED" && videoUrl;
  const isFailed = status === "FAILED";
  const isProcessing = !isReady && !isFailed;
  const color = PROVIDER_COLORS[provider] || "gray";
  const label = STATUS_LABEL[status] || "Queued";

  return (
    <Box
      data-testid={`generation-card-${provider}`}
      onClick={isReady ? onSelect : undefined}
      role={isReady ? "button" : undefined}
      borderRadius="2xl"
      bg="white"
      border="2px solid"
      borderColor={isSelected ? "purple.500" : "gray.200"}
      overflow="hidden"
      cursor={isReady ? "pointer" : "default"}
      opacity={isFailed ? 0.5 : 1}
      transition="all 0.2s"
      _hover={isReady ? { shadow: "lg", borderColor: "gray.300" } : {}}
    >
      {/* Provider color bar */}
      <Box h="1" bg={`${color}.500`} />

      <Box p="4">
        <Box display="flex" alignItems="center" justifyContent="space-between" mb="3">
          <Text fontWeight="semibold" fontSize="sm">{provider}</Text>
          <Badge
            colorPalette={isReady ? "green" : isFailed ? "red" : "gray"}
            variant="subtle"
            borderRadius="full"
            size="sm"
          >
            {isProcessing && (
              <Box as="span" w="1.5" h="1.5" borderRadius="full" bg="currentColor" mr="1" display="inline-block" />
            )}
            {label}
          </Badge>
        </Box>

        {isReady && videoUrl ? (
          <Box borderRadius="xl" overflow="hidden" bg="black">
            <video
              src={videoUrl}
              style={{ width: "100%", aspectRatio: "16/9", display: "block" }}
              muted
              loop
              playsInline
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
            />
          </Box>
        ) : isFailed ? (
          <Box
            display="flex" alignItems="center" justifyContent="center"
            aspectRatio="16/9" borderRadius="xl" bg="red.50" color="red.500"
            fontSize="sm"
          >
            {errorMessage || "Generation failed"}
          </Box>
        ) : (
          <Box
            display="flex" flexDir="column" alignItems="center" justifyContent="center"
            aspectRatio="16/9" borderRadius="xl" bg="gray.50" gap="3"
          >
            <Spinner size="md" color="purple.500" />
            <Text fontSize="xs" color="gray.400" fontWeight="medium">{label}...</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
