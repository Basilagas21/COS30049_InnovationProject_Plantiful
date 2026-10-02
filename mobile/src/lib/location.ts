import * as Location from 'expo-location';
import { Directory, File, Paths } from 'expo-file-system';

export type LocationFix = {
  lat: number;
  lng: number;
  accuracyM: number | null;
};

const PHOTOS_DIR = 'captures';

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentPosition(): Promise<LocationFix | null> {
  const granted = await requestLocationPermission();
  if (!granted) return null;

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracyM: pos.coords.accuracy,
  };
}

export async function persistCapturedPhoto(cacheUri: string): Promise<string> {
  const dir = new Directory(Paths.document, PHOTOS_DIR);
  if (!dir.exists) {
    dir.create();
  }
  const name = `capture-${Date.now()}.jpg`;
  const dest = new File(dir, name);
  await new File(cacheUri).copy(dest);
  return dest.uri;
}