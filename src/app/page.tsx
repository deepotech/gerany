// Root redirect is handled by next.config.mjs redirects().
// This page component is preserved as a fallback but should never be rendered
// in normal traffic. The next.config.mjs redirect fires before the App Router.
export default function RootPage() {
  return null;
}
