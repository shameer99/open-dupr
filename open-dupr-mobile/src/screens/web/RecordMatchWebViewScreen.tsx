import React from "react";
import { View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

export default function RecordMatchWebViewScreen() {
  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: "https://open-dupr-web.vercel.app/record-match" }}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator style={{ marginTop: 24 }} />
        )}
      />
    </View>
  );
}

