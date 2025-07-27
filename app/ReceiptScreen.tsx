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
    onSuccess: () => Alert.alert("Success", "Receipt uploaded successfully!"),
    onError: (error) => {
      console.error("Upload failed:", error);
      Alert.alert("Error", "Upload failed, receipt saved offline.");
    },
  });

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
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const networkState = await NetInfo.fetch();

      const base64Image = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (networkState.isConnected) {
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
    flexDirection: "row",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  permissionText: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
    paddingHorizontal: 20,
  },
});
