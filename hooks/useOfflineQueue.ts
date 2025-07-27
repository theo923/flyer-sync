import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system";
import { trpc } from "../trpc";

const QUEUE_KEY = "offlineUploadQueue";

interface QueueItem {
  uri: string;
  timestamp: number;
}

export function useOfflineQueue() {
  const uploadMutation = trpc.uploadReceipt.useMutation();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        await processOfflineQueue();
      }
    });

    return unsubscribe;
  }, []);

  const addToQueue = async (uri: string) => {
    try {
      const existingQueue = await AsyncStorage.getItem(QUEUE_KEY);
      const queue: QueueItem[] = existingQueue ? JSON.parse(existingQueue) : [];

      queue.push({ uri, timestamp: Date.now() });
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("Failed to add to offline queue:", error);
    }
  };

  const processOfflineQueue = async () => {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_KEY);
      if (!queueData) return;

      const queue: QueueItem[] = JSON.parse(queueData);
      if (queue.length === 0) return;

      console.log(`Processing ${queue.length} offline receipts...`);

      const processedItems: string[] = [];

      for (const item of queue) {
        try {
          const base64Image = await FileSystem.readAsStringAsync(item.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          await uploadMutation.mutateAsync({ imageBase64: base64Image });
          processedItems.push(item.uri);

          console.log("✅ Uploaded offline receipt");
        } catch (error) {
          console.error("Failed to upload offline receipt:", error);
          break; // Stop processing on first failure
        }
      }

      // Remove successfully processed items
      if (processedItems.length > 0) {
        const remainingQueue = queue.filter(
          (item) => !processedItems.includes(item.uri)
        );
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
      }
    } catch (error) {
      console.error("Failed to process offline queue:", error);
    }
  };

  const getQueueSize = async (): Promise<number> => {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_KEY);
      if (!queueData) return 0;

      const queue: QueueItem[] = JSON.parse(queueData);
      return queue.length;
    } catch (error) {
      console.error("Failed to get queue size:", error);
      return 0;
    }
  };

  return {
    addToQueue,
    processOfflineQueue,
    getQueueSize,
  };
}
