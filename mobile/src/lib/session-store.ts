// Web fallback for session persistence. expo-secure-store has no web
// implementation; the mobile web preview keeps using AsyncStorage, and the
// real security posture applies to the shipped Android target.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const sessionStore = AsyncStorage;
