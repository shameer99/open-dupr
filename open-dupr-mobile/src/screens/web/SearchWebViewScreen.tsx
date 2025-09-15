import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import * as SecureStore from "expo-secure-store";

export default function SearchWebViewScreen() {
  const ref = useRef<WebView>(null);

  useEffect(() => {
    (async () => {
      // If the web app supports tokens via headers/query, we could pass them.
      // For now, load the desktop search as-is.
    })();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={ref}
        source={{ uri: "https://open-dupr-web.vercel.app/search" }}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator style={{ marginTop: 24 }} />
        )}
      />
    </View>
  );
}

