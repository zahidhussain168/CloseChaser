/**
 * Per-navigation transition wrapper. A template re-mounts on every route change
 * (unlike a layout), so the content settles up 8px each time you move between
 * the dashboard, a client, and settings. See the "ink on paper" motion system.
 */
export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="page-enter">{children}</div>;
}
