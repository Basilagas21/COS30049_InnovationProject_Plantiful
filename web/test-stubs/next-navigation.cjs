function noopRouter() {
  return { push() {}, refresh() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
}

module.exports = {
  useRouter: noopRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
};
