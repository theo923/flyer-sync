import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, createTrpcClient } from "../trpc";
import ReceiptScreen from "./ReceiptScreen";

const queryClient = new QueryClient();
const token = process.env.EXPO_PUBLIC_JWT_TOKEN || "";
const trpcClient = createTrpcClient(token);

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ReceiptScreen />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
