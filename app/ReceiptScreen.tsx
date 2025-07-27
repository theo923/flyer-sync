import React, { useRef, useEffect } from "react";
import { Text, View, Button, StyleSheet, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system";
import { trpc } from "../trpc";
import { useOfflineQueue } from "../hooks/useOfflineQueue";

export default function ReceiptScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { addToQueue } = useOfflineQueue();

  const uploadMutation = trpc.uploadReceipt.useMutation({
    onSuccess: (data) => {
      console.log("Upload successful:", data);
      Alert.alert("Success", "Receipt uploaded successfully!");
    },
    onError: (error) => {
      console.error("Upload failed - Full error:", error);
      console.error("Error message:", error.message);
      console.error("Error code:", error.data?.code);
      console.error("Error shape:", error.shape);
      Alert.alert("Error", `Upload failed: ${error.message}`);
    },
  });

  // Add a test query to check authentication status
  const testQuery = trpc.getReceipts.useQuery();

  // Check authentication status
  useEffect(() => {
    if (testQuery.error) {
      console.error("Auth test failed:", testQuery.error);
    } else if (testQuery.data) {
      console.log("Auth test successful:", testQuery.data);
    }
  }, [testQuery.error, testQuery.data]);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCaptureReceipt = async () => {
    if (!cameraRef.current) {
      Alert.alert("Error", "Camera not ready");
      return;
    }

    try {
      console.log("Starting photo capture...");
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      console.log("Photo captured:", photo.uri);

      const networkState = await NetInfo.fetch();
      console.log("Network state:", networkState.isConnected);

      const base64Image = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log("Base64 image length:", base64Image.length);

      if (networkState.isConnected) {
        console.log("Attempting upload...");
        uploadMutation.mutate({ imageBase64: base64Image });
      } else {
        await addToQueue(photo.uri);
        Alert.alert(
          "Offline",
          "Receipt saved offline. Will upload when connected."
        );
      }
    } catch (error) {
      console.error("Capture failed:", error);
      Alert.alert("Error", "Failed to capture receipt");
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera access is required to scan receipts
        </Text>
        <Button title="Grant Camera Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />
      <View style={styles.controls}>
        <Text style={styles.authStatus}>
          Auth Status:{" "}
          {testQuery.error ? "Failed" : testQuery.data ? "OK" : "Loading..."}
        </Text>
        <Button
          title={uploadMutation.isPending ? "Processing..." : "Scan Receipt"}
          onPress={handleCaptureReceipt}
          disabled={uploadMutation.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  camera: {
    flex: 1,
  },
  controls: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  authStatus: {
    color: "white",
    marginBottom: 10,
    fontSize: 12,
  },
  permissionText: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
    paddingHorizontal: 20,
  },
});
