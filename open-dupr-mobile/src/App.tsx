import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import LoginScreen from "./screens/LoginScreen";
import ProfileScreen from "./screens/ProfileScreen";
import FeedScreen from "./screens/FeedScreen";
import SearchWebViewScreen from "./screens/web/SearchWebViewScreen";
import RecordMatchWebViewScreen from "./screens/web/RecordMatchWebViewScreen";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  SearchWeb: undefined;
  RecordMatchWeb: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const AppTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerLargeTitle: true,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName =
            route.name === "Profile"
              ? (focused ? "person" : "person-outline")
              : route.name === "Feed"
              ? (focused ? "newspaper" : "newspaper-outline")
              : (focused ? "search" : "search-outline");
          // @ts-ignore - Ionicons type is lax in RN
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#111827",
        tabBarInactiveTintColor: "#9CA3AF",
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  const { token } = useAuth();
  return (
    <RootStack.Navigator>
      {token ? (
        <>
          <RootStack.Screen
            name="Main"
            component={AppTabs}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="SearchWeb"
            component={SearchWebViewScreen}
            options={{ title: "Search" }}
          />
          <RootStack.Screen
            name="RecordMatchWeb"
            component={RecordMatchWebViewScreen}
            options={{ title: "Record Match" }}
          />
        </>
      ) : (
        <RootStack.Screen name="Auth" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </RootStack.Navigator>
  );
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#ffffff",
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <RootNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

