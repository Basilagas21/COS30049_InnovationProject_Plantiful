// Test-only stand-in for next/link: renders a plain anchor so server markup
// tests see the href and children without the Next client runtime.
import { createElement } from 'react';

export default function Link({ href, children, prefetch, ...rest }) {
  return createElement('a', { href }, children);
}
