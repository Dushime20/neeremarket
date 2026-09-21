export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="container">
      <h1>{title}</h1>
      <p>This page is wired in the route map and will be completed in the matching implementation phase.</p>
    </div>
  );
}
