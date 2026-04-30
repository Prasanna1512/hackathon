"use client";

export function SkeletonLoader() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
      <div className="glass-card" style={{ padding: 24 }}>
        <div className="skeleton skeleton-title" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div className="skeleton skeleton-text" style={{ width: "40%" }} />
            <div className="skeleton" style={{ height: 48, marginTop: 8 }} />
          </div>
          <div>
            <div className="skeleton skeleton-text" style={{ width: "50%" }} />
            <div className="skeleton" style={{ height: 48, marginTop: 8 }} />
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <div className="skeleton skeleton-text" style={{ width: "30%" }} />
          <div className="skeleton skeleton-card" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="glass-card">
          <div className="skeleton skeleton-text" style={{ width: "60%" }} />
          <div className="skeleton" style={{ height: 40 }} />
          <div className="skeleton skeleton-text" style={{ width: "80%", marginTop: 12 }} />
        </div>
        <div className="glass-card">
          <div className="skeleton skeleton-text" style={{ width: "50%" }} />
          <div className="skeleton" style={{ height: 34, width: 120, borderRadius: 20, marginTop: 8 }} />
          <div className="skeleton skeleton-text" style={{ width: "70%", marginTop: 12 }} />
        </div>
      </div>
    </div>
  );
}
