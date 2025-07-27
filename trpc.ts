import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import { AppRouter } from "./types/server";

export const trpc = createTRPCReact<AppRouter>();

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000/trpc";

export function createTrpcClient(token?: string) {
  return trpc.createClient({
    links: [
      httpLink({
        url: BASE_URL,
        headers() {
          return {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
          };
        },
      }),
    ],
  });
}
