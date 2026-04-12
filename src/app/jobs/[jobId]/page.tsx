"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Box, Container, HStack, VStack, Heading, Text, Badge, Button, Spinner } from "@chakra-ui/react";
import { HeaderClient } from "@/components/header-client";
import { ResultsGallery } from "@/components/results-gallery";

interface Generation {
  id: string;
  provider: string;
  status: string;
  videoUrl?: string | null;
  errorMessage?: string | null;
  updatedAt: string;
}

interface Job {
  id: string;
  status: string;
  prompt: string;
  duration: number;
  generations: Generation[];
  createdAt: string;
}

export default function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) { setError("Job not found"); return; }
        const data = await res.json();
        if (active) setJob(data);

        const allDone = data.generations.every(
          (g: Generation) => g.status === "COMPLETED" || g.status === "FAILED"
        );
        if (!allDone && active) setTimeout(poll, 4000);
      } catch {
        if (active) setError("Failed to load job status");
      }
    }

    poll();
    return () => { active = false; };
  }, [jobId]);

  if (error) {
    return (
      <Box minH="100vh" bg="gray.50">
        <HeaderClient />
        <VStack py="24" gap="4">
          <Text fontSize="lg" fontWeight="medium">{error}</Text>
          <Link href="/"><Button colorPalette="purple">Create New Ad</Button></Link>
        </VStack>
      </Box>
    );
  }

  if (!job) {
    return (
      <Box minH="100vh" bg="gray.50">
        <HeaderClient />
        <VStack py="24" gap="4">
          <Spinner size="lg" color="purple.500" />
          <Text fontSize="sm" color="gray.500">Loading your ad results...</Text>
        </VStack>
      </Box>
    );
  }

  const completedCount = job.generations.filter((g) => g.status === "COMPLETED").length;
  const totalCount = job.generations.length;
  const allDone = job.generations.every((g) => g.status === "COMPLETED" || g.status === "FAILED");

  return (
    <Box minH="100vh" bg="gray.50">
      <HeaderClient />
      <Container maxW="1100px" py="8">
        <VStack gap="8" align="stretch">
          <Box display="flex" justifyContent="space-between" alignItems="start" flexWrap="wrap" gap="3">
            <Box>
              <HStack gap="3" mb="1">
                <Heading size="xl" fontWeight="bold">Your Video Ads</Heading>
                <Badge colorPalette="purple" variant="subtle" borderRadius="full">{job.duration}s</Badge>
              </HStack>
              <Text fontSize="sm" color="gray.500" maxW="600px" lineClamp={2}>{job.prompt}</Text>
            </Box>
            <Badge
              colorPalette={allDone ? "green" : "yellow"}
              variant="subtle"
              borderRadius="full"
              px="3"
              py="1"
              fontSize="sm"
            >
              {completedCount}/{totalCount} ready
            </Badge>
          </Box>

          <ResultsGallery generations={job.generations} />

          <Box pt="6" borderTop="1px solid" borderColor="gray.200">
            <Link href="/">
              <Button variant="outline">+ Create Another Ad</Button>
            </Link>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
