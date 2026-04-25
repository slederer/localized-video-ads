"use client";

import { useState, useTransition } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Badge,
  Stack,
} from "@chakra-ui/react";
import { HeaderClient } from "@/components/header-client";
import { saveApiKeyAction, deleteApiKeyAction } from "./actions";

export type SettingsItem = {
  provider: string;
  label: string;
  description: string;
  hasKey: boolean;
  source: "db" | "env" | "missing";
  updatedAt: string | null;
};

export function SettingsClient({ items }: { items: SettingsItem[] }) {
  return (
    <Box minH="100vh" bg="gray.50">
      <HeaderClient />
      <Container maxW="800px" py="10" px="6">
        <VStack gap="2" align="stretch" mb="8">
          <Heading size="xl">Settings</Heading>
          <Text color="gray.600" fontSize="sm">
            Configure API keys for video providers and other services. Keys are
            encrypted at rest.
          </Text>
        </VStack>

        <VStack gap="4" align="stretch">
          {items.map((item) => (
            <ApiKeyCard key={item.provider} item={item} />
          ))}
        </VStack>
      </Container>
    </Box>
  );
}

function ApiKeyCard({ item }: { item: SettingsItem }) {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const onSave = () => {
    if (value.trim().length < 8) {
      setMessage({ kind: "err", text: "API key looks too short" });
      return;
    }
    const fd = new FormData();
    fd.set("provider", item.provider);
    fd.set("apiKey", value);
    startTransition(async () => {
      const result = await saveApiKeyAction(fd);
      if (result.ok) {
        setMessage({ kind: "ok", text: "Saved" });
        setValue("");
      } else {
        setMessage({ kind: "err", text: result.error });
      }
    });
  };

  const onDelete = () => {
    const fd = new FormData();
    fd.set("provider", item.provider);
    startTransition(async () => {
      const result = await deleteApiKeyAction(fd);
      if (result.ok) {
        setMessage({ kind: "ok", text: "Removed" });
      } else {
        setMessage({ kind: "err", text: result.error });
      }
    });
  };

  return (
    <Box
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.200"
      p="5"
    >
      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "flex-start" }}
        gap="4"
        mb="3"
      >
        <Box>
          <HStack gap="2" mb="1">
            <Heading size="md">{item.label}</Heading>
            <StatusBadge item={item} />
          </HStack>
          <Text fontSize="sm" color="gray.600">
            {item.description}
          </Text>
          {item.updatedAt && (
            <Text fontSize="xs" color="gray.500" mt="1">
              Last updated: {new Date(item.updatedAt).toLocaleString()}
            </Text>
          )}
        </Box>
      </Stack>

      <HStack gap="2" align="flex-start" flexWrap="wrap">
        <Box flex="1" minW="200px">
          <Input
            type="password"
            placeholder={item.hasKey ? "Enter new key to replace" : "Paste API key"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPending}
            autoComplete="off"
          />
        </Box>
        <Button
          colorPalette="purple"
          onClick={onSave}
          loading={isPending}
          disabled={!value.trim()}
        >
          Save
        </Button>
        {item.hasKey && item.source === "db" && (
          <Button variant="outline" onClick={onDelete} loading={isPending}>
            Remove
          </Button>
        )}
      </HStack>

      {message && (
        <Text
          mt="2"
          fontSize="sm"
          color={message.kind === "ok" ? "green.600" : "red.600"}
        >
          {message.text}
        </Text>
      )}
    </Box>
  );
}

function StatusBadge({ item }: { item: SettingsItem }) {
  if (item.source === "db") {
    return <Badge colorPalette="green">Configured</Badge>;
  }
  if (item.source === "env") {
    return <Badge colorPalette="yellow">From env</Badge>;
  }
  return <Badge colorPalette="gray">Not set</Badge>;
}
