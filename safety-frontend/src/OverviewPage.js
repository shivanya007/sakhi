import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Shield, AlertTriangle, MapPin, ArrowRight, Map, Bell, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = "http://localhost:8000";

const C = {
  cherry: '#4A000C', cherryDeep: '#2E0007', cherryMuted: '#6B1020',
  rose: '#B8696E', roseLight: '#D4989C', roseFaint: '#E8C4C7',
  nude: '#EDE0CC', nudeWarm: '#F5EFE4', nudeDeep: '#D6C5A8', nudeDark: '#C4AF8E',
  textPrimary: '#2A0008', textSecondary: '#6B3040', textMuted: '#9C7070',
  safe: '#2D8653', safeFaint: '#E6F4ED', safeBorder: '#A3D4BB',
  danger: '#B91C1C',
};

const INCIDENT_META = {
  harassment:    { emoji: '⚠️', color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA', label: 'Harassment' },
  theft:         { emoji: '🔓', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', label: 'Theft' },
  poor_lighting: { emoji: '💡', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', label: 'Poor Lighting' },
  assault:       { emoji: '🚨', color: C.danger,  bg: '#FEF2F2', border: '#FECACA', label: 'Assault' },
};

const DONUT_COLORS = {
  assault: C.cherryDeep,
  harassment: C.cherry,
  theft: C.rose,
  poor_lighting: C.nudeDark,
};

const overviewCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,800;1,700&family=DM+Sans:wght@300;400;500&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes drawDonut {
    from { stroke-dashoffset: 300; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes pulseAlert {
    0%, 100% { box-shadow: 0 0 0 0 rgba(185,28,28,0.25); }
    50%       { box-shadow: 0 0 0 6px rgba(185,28,28,0); }
  }

  .ov-card {
    background: #fff;
    border: 1.5px solid ${C.nudeDeep};
    border-radius: 16px;
    padding: 22px 24px;
    box-shadow: 0 2px 16px rgba(74,0,12,0.06);
    transition: box-shadow 0.2s, transform 0.2s;
    animation: fadeUp 0.5s ease both;
  }
  .ov-card:hover {
    box-shadow: 0 6px 28px rgba(74,0,12,0.11);
    transform: translateY(-2px);
  }

  .ov-stat-number {
    font-family: 'Playfair Display', serif;
    font-size: 3rem;
    font-weight: 800;
    color: ${C.cherry};
    line-height: 1;
    animation: countUp 0.6s 0.3s ease both;
  }

  .ov-cta-btn {
    width: 100%;
    padding: 20px 28px;
    background: linear-gradient(135deg, ${C.cherry} 0%, ${C.cherryMuted} 100%);
    color: ${C.nudeWarm};
    border: none;
    border-radius: 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    box-shadow: 0 6px 28px rgba(74,0,12,0.35);
    transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
    animation: fadeUp 0.5s 0.6s ease both;
  }
  .ov-cta-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(74,0,12,0.45);
    background: linear-gradient(135deg, ${C.cherryMuted} 0%, ${C.cherry} 100%);
  }
  .ov-cta-btn:active { transform: scale(0.99); }

  .ov-report-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: ${C.nudeWarm};
    border: 1.5px solid ${C.nudeDeep};
    border-radius: 10px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s, transform 0.15s;
    animation: fadeUp 0.4s ease both;
  }
  .ov-report-row:hover {
    border-color: ${C.rose};
    background: ${C.roseFaint};
    transform: translateX(3px);
  }
  .ov-report-row.expanded {
    border-color: ${C.rose};
    background: ${C.roseFaint};
  }

  .ov-alert-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    background: ${C.danger};
    flex-shrink: 0;
    animation: pulseAlert 2s infinite;
  }

  .ov-legend-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .ov-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 2px 9px;
    border-radius: 100px;
    white-space: nowrap;
  }
`;

/* ── Animated counter ── */
function AnimatedNumber({ target, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setDisplay(start);
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{display}</span>;
}

/* ── SVG Donut Chart ── */
function DonutChart({ data, size = 110 }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: '50%', background: C.nudeDeep }} />;

  const cx = size / 2, cy = size / 2, r = (size - 20) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const slices = Object.entries(data).map(([key, val]) => {
    const pct = val / total;
    const dashLen = pct * circumference;
    const slice = { key, val, pct, dashLen, offset, color: DONUT_COLORS[key] || C.rose };
    offset += dashLen;
    return slice;
  });

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {slices.map(s => (
        <circle
          key={s.key}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={18}
          strokeDasharray={`${s.dashLen} ${circumference - s.dashLen}`}
          strokeDashoffset={-s.offset}
          strokeLinecap="butt"
        />
      ))}
      {/* Center hole */}
      <circle cx={cx} cy={cy} r={r - 10} fill="#fff" />
    </svg>
  );
}

/* ── Report Row (expandable) ── */
function ReportRow({ report, index }) {
  const [open, setOpen] = useState(false);
  const meta = INCIDENT_META[report.incident_type] || INCIDENT_META.harassment;
  const timeAgo = report.time_of_incident || 'Recently';

  return (
    <div
      className={`ov-report-row ${open ? 'expanded' : ''}`}
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={() => setOpen(v => !v)}
    >
      <span style={{ fontSize: '16px' }}>{meta.emoji}</span>
      <span className="ov-badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
        {report.incident_type.replace('_', ' ')}
      </span>
      <span style={{ fontSize: '12px', color: C.textMuted, flex: 1 }}>{timeAgo}</span>
      {report.description && (
        <span style={{ color: C.textMuted, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <ChevronDown size={14} />
        </span>
      )}
      {open && report.description && (
        <div style={{ width: '100%', marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${C.roseFaint}`, fontSize: '12px', color: C.textSecondary, lineHeight: 1.6, animation: 'fadeUp 0.2s ease both' }}>
          {report.description}
        </div>
      )}
    </div>
  );
}

/* ── Main OverviewPage ── */
export default function OverviewPage({ onEnterPortal }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tag = document.createElement('style');
    tag.textContent = overviewCSS;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE}/heatmap`)
      .then(res => { setReports(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  /* ── Derived stats ── */
  const total = reports.length;
  const breakdown = reports.reduce((acc, r) => {
    acc[r.incident_type] = (acc[r.incident_type] || 0) + 1;
    return acc;
  }, {});

  const mostReported = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0];

  // Hotspots: cluster by ~0.01 degree grid
  const grid = {};
  reports.forEach(r => {
    const key = `${Math.round(r.latitude * 100)},${Math.round(r.longitude * 100)}`;
    grid[key] = (grid[key] || 0) + 1;
  });
  const hotspots = Object.values(grid).filter(v => v >= 2).length;

  const alerts = Object.entries(breakdown).map(([type, count]) => ({
    type, count, meta: INCIDENT_META[type] || INCIDENT_META.harassment
  })).sort((a, b) => b.count - a.count).slice(0, 3);

  const latest = [...reports].reverse().slice(0, 4);

  return (
    <div style={{
      minHeight: '100vh',
      background: C.nude,
      backgroundImage: `radial-gradient(ellipse 80% 60% at 15% 0%, rgba(184,105,110,0.12) 0%, transparent 55%),
                        radial-gradient(ellipse 60% 70% at 90% 100%, rgba(74,0,12,0.08) 0%, transparent 50%)`,
      fontFamily: "'DM Sans', sans-serif",
      color: C.textPrimary,
      padding: '0 0 60px',
    }}>

      {/* ── Header ── */}
      <header style={{
        textAlign: 'center',
        padding: '48px 24px 32px',
        animation: 'fadeUp 0.5s ease both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
          <Shield size={20} color={C.rose} />
          <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.rose }}>
            Women Safety Portal Overview
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
          fontWeight: 800,
          fontStyle: 'italic',
          color: C.cherry,
          margin: '0 0 16px',
          lineHeight: 1.1,
        }}>
          Portal Overview
        </h1>
        <div style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: '18px 24px',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(8px)',
          border: `1.5px solid ${C.nudeDeep}`,
          borderRadius: '14px',
          fontSize: '15px',
          fontWeight: 400,
          color: C.textSecondary,
          lineHeight: 1.65,
          animation: 'fadeUp 0.5s 0.1s ease both',
        }}>
          Welcome to the <strong style={{ color: C.cherry }}>Women Safety Portal Dashboard.</strong> Get a quick snapshot of the local situation and access detailed tools.
        </div>
      </header>

      {/* ── Body ── */}
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px' }}>

        {/* ── Stats Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>

          {/* Total Reports */}
          <div className="ov-card" style={{ animationDelay: '0.1s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.cherry, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} color={C.nudeWarm} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: C.textSecondary }}>Total Reports</span>
            </div>
            <div className="ov-stat-number">
              {loading ? '—' : <AnimatedNumber target={total} />}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: C.textMuted }}>Incidents in your region this month.</p>
          </div>

          {/* Reports Breakdown */}
          <div className="ov-card" style={{ animationDelay: '0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.rose, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={16} color="#fff" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: C.textSecondary }}>Reports Breakdown</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <DonutChart data={breakdown} size={100} />
              <div style={{ display: 'grid', gap: '5px' }}>
                {Object.entries(INCIDENT_META).map(([type, meta]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="ov-legend-dot" style={{ background: DONUT_COLORS[type] }} />
                    <span style={{ fontSize: '11px', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{meta.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: C.cherry, marginLeft: 'auto' }}>{breakdown[type] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hotspots */}
          <div className="ov-card" style={{ animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.cherryMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Map size={16} color="#fff" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: C.textSecondary }}>Hotspots Identified</span>
            </div>
            <div className="ov-stat-number">
              {loading ? '—' : <AnimatedNumber target={hotspots} duration={900} />}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: C.textMuted }}>High-density risk clusters detected.</p>
            <div style={{ marginTop: '10px', padding: '8px 10px', background: C.nudeWarm, borderRadius: '8px', border: `1px solid ${C.nudeDeep}`, fontSize: '11px', color: C.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={11} color={C.rose} /> View on heatmap in the full portal
            </div>
          </div>

          {/* Community Alerts */}
          <div className="ov-card" style={{ animationDelay: '0.25s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.roseFaint, border: `1.5px solid ${C.rose}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={15} color={C.rose} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: C.textSecondary }}>Community Alerts</span>
            </div>
            {alerts.length === 0 ? (
              <p style={{ fontSize: '13px', color: C.textMuted, fontStyle: 'italic' }}>No active alerts.</p>
            ) : alerts.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px', animation: `fadeUp 0.4s ${i * 0.08}s ease both` }}>
                <div className="ov-alert-dot" style={{ marginTop: '4px' }} />
                <span style={{ fontSize: '12px', color: C.textSecondary, lineHeight: 1.5 }}>
                  <strong style={{ color: C.danger }}>Active:</strong> {a.meta.label} reported at {a.count} location{a.count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Latest Reports */}
          <div className="ov-card" style={{ animationDelay: '0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600, color: C.cherry, margin: 0 }}>
                Latest Reports at a Glance
              </h3>
              <span style={{ fontSize: '11px', fontWeight: 500, color: C.textMuted, background: C.nudeWarm, padding: '2px 10px', borderRadius: '100px', border: `1px solid ${C.nudeDeep}` }}>
                {total} total
              </span>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: '44px', borderRadius: '10px', background: C.nudeDeep, opacity: 0.5 }} />
                ))}
              </div>
            ) : latest.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: C.textMuted, fontSize: '13px' }}>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>🗺️</div>
                No reports yet.
              </div>
            ) : latest.map((r, i) => <ReportRow key={r.id} report={r} index={i} />)}

            {/* Most reported */}
            {mostReported && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${C.nudeDeep}` }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: C.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Most Reported Category</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: C.cherry }}>
                  {mostReported[0].replace('_', ' ').toUpperCase()}:
                  <span style={{ fontWeight: 400, color: C.textSecondary }}> {mostReported[1]} report{mostReported[1] !== 1 ? 's' : ''}</span>
                </p>
              </div>
            )}
          </div>

          {/* Right column: CTA + Community Hub */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* CTA */}
            <div className="ov-card" style={{ animationDelay: '0.35s', display: 'flex', flexDirection: 'column', gap: '0' }}>
              <button className="ov-cta-btn" onClick={onEnterPortal}>
                Go to Full Safety Portal
                <ArrowRight size={20} />
              </button>
              <p style={{ margin: '12px 0 0', fontSize: '12px', color: C.textMuted, textAlign: 'center', lineHeight: 1.5 }}>
                Report incidents, check area safety scores, find safe routes, and view the live heatmap.
              </p>
            </div>

            {/* Community Hub */}
            <div className="ov-card" style={{ animationDelay: '0.4s', flex: 1 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600, color: C.cherry, margin: '0 0 14px' }}>
                Community Hub Highlights
              </h3>
              {[
                { icon: '🗺️', text: 'View Safe Routes',       sub: 'Find low-risk paths near you' },
                { icon: '💬', text: 'Community Forums',       sub: 'Share tips with locals' },
                { icon: '📍', text: 'Pin Unsafe Spots',       sub: 'Mark areas for others' },
                { icon: '🚨', text: 'SOS Quick Share',        sub: 'Send your location instantly' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: i < 3 ? `1px solid ${C.nudeDeep}` : 'none', animation: `fadeUp 0.35s ${0.42 + i * 0.07}s ease both` }}>
                  <span style={{ fontSize: '18px', width: '28px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: C.textPrimary }}>{item.text}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: C.textMuted }}>{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}