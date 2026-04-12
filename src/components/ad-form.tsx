"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, VStack, Heading, Text, Textarea, Button, Alert,
} from "@chakra-ui/react";
import { DurationSelector } from "./duration-selector";
import { UploadZone } from "./upload-zone";

export function AdForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(10);
  const [assets, setAssets] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, duration, assets }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create job");
      }

      const data = await res.json();
      router.push(`/jobs/${data.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  return (
    <Box w="full" maxW="640px">
      <VStack gap="2" mb="10" textAlign="center">
        <Heading size="2xl" fontWeight="bold" letterSpacing="-0.02em">
          Create Your Video Ad
        </Heading>
        <Text color="gray.500" maxW="480px">
          Describe your business and ad. We generate it with 5 AI providers so you can compare and pick your favorite.
        </Text>
      </VStack>

      <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" p="8">
        <form onSubmit={handleSubmit}>
          <VStack gap="6" align="stretch">
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb="2">Describe your ad</Text>
              <Textarea
                id="prompt"
                placeholder="E.g., A cozy Italian restaurant in Brooklyn offering 20% off dinner this weekend. Warm, inviting tone with shots of delicious pasta and happy diners..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                minLength={10}
                maxLength={2000}
                required
                resize="none"
                size="lg"
              />
              <Box display="flex" justifyContent="space-between" mt="1.5">
                <Text fontSize="xs" color="gray.400">Be specific about your business, offer, and desired tone</Text>
                <Text fontSize="xs" color="gray.400">{prompt.length}/2000</Text>
              </Box>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb="2">Choose duration</Text>
              <DurationSelector value={duration} onChange={setDuration} />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb="2">
                Reference images or videos
                <Text as="span" fontWeight="normal" color="gray.400" ml="1">(optional)</Text>
              </Text>
              <UploadZone onUploadComplete={setAssets} />
            </Box>

            {error && (
              <Alert.Root status="error" borderRadius="lg">
                <Alert.Indicator />
                <Alert.Title fontSize="sm">{error}</Alert.Title>
              </Alert.Root>
            )}

            <Button
              type="submit"
              w="full"
              size="lg"
              colorPalette="purple"
              loading={isSubmitting}
              loadingText="Generating with 5 AI providers..."
              disabled={isSubmitting || prompt.length < 10}
            >
              Generate Ad
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}
