"use client";

import { Box, SimpleGrid, Text } from "@chakra-ui/react";

const DURATIONS = [
  { value: 10, label: "10s", desc: "Quick teaser", estimate: "~30s to generate" },
  { value: 15, label: "15s", desc: "Social media", estimate: "~1min to generate" },
  { value: 30, label: "30s", desc: "Full ad spot", estimate: "~3min to generate" },
] as const;

interface DurationSelectorProps {
  value: number;
  onChange: (duration: number) => void;
}

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  return (
    <SimpleGrid columns={3} gap="3">
      {DURATIONS.map((d) => {
        const isActive = value === d.value;
        return (
          <Box
            as="button"
            key={d.value}
            onClick={() => onChange(d.value)}
            p="4"
            borderRadius="xl"
            border="2px solid"
            borderColor={isActive ? "purple.500" : "gray.200"}
            bg={isActive ? "purple.50" : "white"}
            textAlign="center"
            cursor="pointer"
            transition="all 0.15s"
            _hover={{ borderColor: isActive ? "purple.500" : "gray.300" }}
          >
            <Text fontSize="2xl" fontWeight="bold" color={isActive ? "purple.600" : "gray.900"}>
              {d.label}
            </Text>
            <Text fontSize="xs" fontWeight="medium" color={isActive ? "purple.500" : "gray.500"} mt="0.5">
              {d.desc}
            </Text>
            <Text fontSize="2xs" color="gray.400" mt="1">
              {d.estimate}
            </Text>
          </Box>
        );
      })}
    </SimpleGrid>
  );
}
