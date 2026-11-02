// Test-only stand-in for next/navigation: hooks that satisfy server rendering.
export function useRouter() {
  return { push() {}, refresh() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
}

export function usePathname() {
  return '/';
}

export function useSearchParams() {
  return new URLSearchParams();
}
