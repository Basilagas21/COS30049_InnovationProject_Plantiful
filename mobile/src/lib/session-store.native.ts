// Native session persistence: expo-secure-store through the chunked adapter.
// Metro resolves this file on Android/iOS and session-store.ts on web.
// The adapter migrates any legacy AsyncStorage session on first read, so
// installed devices are not signed out by the change.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createChunkedStorage } from './session-store-core';

export const sessionStore = createChunkedStorage(
  {
    get: (key) => SecureStore.getItemAsync(key),
    set: (key, value) => SecureStore.setItemAsync(key, value),
    del: (key) => SecureStore.deleteItemAsync(key),
  },
  {
    migration: {
      read: (key) => AsyncStorage.getItem(key),
      drop: (key) => AsyncStorage.removeItem(key),
    },
  },
);
