import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Text, View, StyleSheet } from "react-native";
import { trpc, createTrpcClient } from "../trpc";
import ReceiptScreen from "./ReceiptScreen";

const queryClient = new QueryClient();

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const trpcClient = createTrpcClient(token || undefined);

  useEffect(() => {
    const getAuthToken = async () => {
      try {
        // Try to get token from environment first
        const envToken = process.env.EXPO_PUBLIC_JWT_TOKEN;
        if (envToken) {
          console.log("Using environment token");
          setToken(envToken);
          setLoading(false);
          return;
        }

        // Otherwise, login to get a fresh token
        console.log("Getting fresh token from login...");
        const baseUrl =
          process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000";
        const loginUrl = baseUrl.replace("/trpc", "/login");

        const response = await fetch(loginUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            username: "testuser",
            password: "testpass",
          }),
        });

        if (!response.ok) {
          throw new Error(`Login failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("Login successful, got token");
        setToken(data.token);
      } catch (err) {
        console.error("Authentication failed:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
      } finally {
        setLoading(false);
      }
    };

    getAuthToken();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Authenticating...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Authentication Error: {error}</Text>
      </View>
    );
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ReceiptScreen />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
