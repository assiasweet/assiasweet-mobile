/**
 * Web version: always return "light" to avoid useSyncExternalStore loop
 * with @react-navigation/core on React 19 + react-native-web.
 */
export function useColorScheme() {
  return "light" as const;
}
