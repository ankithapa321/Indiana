export default function Loading() {
  return (
    <div className="detail-page" aria-busy="true">
      <main className="detail-layout">
        <div className="detail-media">
          <div className="img-wrap skeleton" />
        </div>
        <div className="detail-info">
          <div className="skeleton-line wide" />
          <div className="skeleton-line" />
          <div className="divider" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <p className="label">Loading products…</p>
        </div>
      </main>
    </div>
  );
}
