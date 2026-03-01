import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import OverviewPage from './OverviewPage';
import { Shield, AlertTriangle, MapPin, Map as MapIcon, ChevronDown, ChevronUp, Filter, Clock, Navigation, CheckCircle, Loader } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { HeatmapLayer } from 'react-leaflet-heatmap-layer-v3';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = "http://localhost:8000";

const C = {
  cherry: '#4A000C', cherryDeep: '#2E0007', cherryMuted: '#6B1020',
  rose: '#B8696E', roseLight: '#D4989C', roseFaint: '#E8C4C7',
  nude: '#EDE0CC', nudeWarm: '#F5EFE4', nudeDeep: '#D6C5A8', nudeDark: '#C4AF8E',
  textPrimary: '#2A0008', textMuted: '#9C7070',
  safe: '#2D8653', safeFaint: '#E6F4ED', safeBorder: '#A3D4BB',
  danger: '#B91C1C',
};

const INCIDENT_META = {
  harassment:    { emoji: '⚠️', color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' },
  theft:         { emoji: '🔓', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  poor_lighting: { emoji: '💡', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
  assault:       { emoji: '🚨', color: C.danger,  bg: '#FEF2F2', border: '#FECACA' },
};

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,700&family=DM+Sans:wght@300;400;500&display=swap');
  @keyframes fadeSlideIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes stepPop { 0% { transform:scale(0.93); opacity:0; } 60% { transform:scale(1.02); } 100% { transform:scale(1); opacity:1; } }
  @keyframes successBounce { 0% { transform:scale(0); opacity:0; } 55% { transform:scale(1.2); } 100% { transform:scale(1); opacity:1; } }
  @keyframes incidentIn { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }

  .incident-card {
    border-radius:12px; border:1.5px solid transparent;
    margin-bottom:10px; overflow:hidden;
    transition:box-shadow 0.2s, border-color 0.2s, transform 0.15s, background 0.2s;
    cursor:pointer; animation:incidentIn 0.35s ease both;
  }
  .incident-card:hover { transform:translateX(4px); box-shadow:0 4px 20px rgba(74,0,12,0.10); }
  .incident-card.expanded { box-shadow:0 6px 28px rgba(74,0,12,0.14); }

  .form-input {
    width:100%; padding:11px 14px;
    background:#fff; border:1.5px solid ${C.nudeDeep};
    border-radius:10px; font-size:14px;
    font-family:'DM Sans',sans-serif; color:${C.textPrimary};
    outline:none; box-sizing:border-box;
    transition:border-color 0.2s, box-shadow 0.2s;
  }
  .form-input:focus { border-color:${C.rose}; box-shadow:0 0 0 3px rgba(184,105,110,0.15); }
  .form-input.filled { border-color:${C.safe}; background:#F0FDF4; }

  .step-dot {
    width:28px; height:28px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:600; flex-shrink:0;
    transition:background 0.3s, color 0.3s, transform 0.2s;
  }
  .step-dot.active   { background:${C.cherry}; color:${C.nudeWarm}; transform:scale(1.12); }
  .step-dot.done     { background:${C.safe};   color:white; }
  .step-dot.inactive { background:${C.nudeDeep}; color:${C.textMuted}; }

  .step-line { flex:1; height:2px; background:${C.nudeDeep}; position:relative; overflow:hidden; }
  .step-line-fill { position:absolute; top:0; left:0; height:100%; background:${C.safe}; transition:width 0.5s cubic-bezier(0.4,0,0.2,1); }

  .filter-chip {
    padding:5px 14px; border-radius:100px;
    border:1.5px solid ${C.nudeDeep}; font-size:12px;
    font-family:'DM Sans',sans-serif; font-weight:500;
    cursor:pointer; transition:all 0.18s; white-space:nowrap;
    background:#fff; color:${C.textMuted};
  }
  .filter-chip:hover { border-color:${C.rose}; color:${C.rose}; }
  .filter-chip.active { background:${C.cherry}; border-color:${C.cherry}; color:${C.nudeWarm}; }

  .sos-btn {
    background:linear-gradient(135deg,${C.danger} 0%,#7F1D1D 100%);
    color:white; width:100%; padding:15px; border-radius:12px;
    font-weight:700; font-size:17px; border:none; cursor:pointer;
    margin-bottom:20px; display:flex; align-items:center; justify-content:center; gap:10px;
    box-shadow:0 4px 18px rgba(185,28,28,0.35);
    transition:transform 0.15s, box-shadow 0.2s; position:relative; overflow:hidden;
  }
  .sos-btn:hover  { transform:translateY(-2px); box-shadow:0 8px 28px rgba(185,28,28,0.4); }
  .sos-btn:active { transform:scale(0.98); }

  .primary-btn {
    background:${C.cherry}; color:${C.nudeWarm};
    border:none; padding:12px; border-radius:10px;
    cursor:pointer; font-size:14px; font-weight:500;
    font-family:'DM Sans',sans-serif; width:100%;
    transition:background 0.2s, transform 0.15s; letter-spacing:0.02em;
  }
  .primary-btn:hover  { background:${C.cherryMuted}; transform:translateY(-1px); }
  .primary-btn:active { transform:scale(0.99); }
  .primary-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

  .back-btn {
    background:${C.nudeDeep}; color:${C.textPrimary};
    border:none; padding:12px; border-radius:10px;
    cursor:pointer; font-size:14px; font-weight:500;
    font-family:'DM Sans',sans-serif;
    transition:background 0.2s; letter-spacing:0.02em;
  }
  .back-btn:hover { background:${C.nudeDark}; }

  .submit-btn {
    background:linear-gradient(135deg,${C.danger} 0%,#7F1D1D 100%);
    color:white; border:none; padding:13px; border-radius:10px;
    cursor:pointer; font-size:14px; font-weight:600;
    font-family:'DM Sans',sans-serif; width:100%;
    transition:transform 0.15s, box-shadow 0.2s; letter-spacing:0.02em;
    box-shadow:0 3px 12px rgba(185,28,28,0.25);
  }
  .submit-btn:hover  { transform:translateY(-1px); box-shadow:0 6px 20px rgba(185,28,12,0.35); }
  .submit-btn:active { transform:scale(0.99); }

  .heatmap-btn {
    display:inline-flex; align-items:center; gap:8px;
    margin-top:18px; padding:10px 26px;
    background:${C.rose}; color:${C.nudeWarm};
    border:none; border-radius:100px; font-size:13px; font-weight:500;
    letter-spacing:0.06em; text-transform:uppercase; cursor:pointer;
    font-family:'DM Sans',sans-serif;
    box-shadow:0 4px 18px rgba(184,105,110,0.35);
    transition:background 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .heatmap-btn:hover { background:${C.roseLight}; transform:translateY(-2px); box-shadow:0 8px 28px rgba(184,105,110,0.45); }

  .coord-display {
    display:flex; gap:8px; align-items:center;
    padding:9px 13px; background:rgba(74,0,12,0.04);
    border:1.5px dashed ${C.nudeDeep}; border-radius:10px;
    font-size:12px; color:${C.textMuted}; transition:all 0.3s;
  }
  .coord-display.has-coords { background:${C.safeFaint}; border-color:${C.safeBorder}; border-style:solid; color:${C.safe}; }

  .incident-expand { padding:0 14px 14px; animation:fadeSlideIn 0.22s ease both; }
  .navigate-link {
    display:inline-flex; align-items:center; gap:4px;
    font-size:12px; font-weight:500; color:${C.safe};
    text-decoration:none; padding:4px 10px;
    background:${C.safeFaint}; border-radius:100px;
    transition:background 0.2s;
  }
  .navigate-link:hover { background:${C.safeBorder}; }
  .maps-link {
    display:inline-flex; align-items:center; gap:5px;
    font-size:12px; font-weight:500; color:${C.cherry};
    background:${C.roseFaint}; padding:5px 12px;
    border-radius:100px; text-decoration:none;
    transition:background 0.2s;
  }
  .maps-link:hover { background:${C.roseLight}; color:#fff; }

  .radio-option {
    display:flex; align-items:center; gap:12px;
    padding:12px 15px; border-radius:10px;
    border:1.5px solid ${C.nudeDeep}; background:#fff;
    cursor:pointer; transition:all 0.18s;
  }
`;

/* ─── Step Indicator ─── */
function StepIndicator({ step }) {
  const steps = ['Location', 'Incident', 'Details'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '22px' }}>
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : 'inactive'}`}>
              {i < step ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 500, color: i === step ? C.cherry : C.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="step-line" style={{ margin: '0 4px', marginBottom: '16px' }}>
              <div className="step-line-fill" style={{ width: i < step ? '100%' : '0%' }} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── Incident Card ─── */
function IncidentCard({ report, index }) {
  const [expanded, setExpanded] = useState(false);
  const meta = INCIDENT_META[report.incident_type] || INCIDENT_META.harassment;
  return (
    <div
      className={`incident-card ${expanded ? 'expanded' : ''}`}
      style={{ background: expanded ? meta.bg : '#fff', borderColor: expanded ? meta.border : C.nudeDeep, animationDelay: `${index * 0.06}s` }}
      onClick={() => setExpanded(v => !v)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px' }}>
        <span style={{ fontSize: '20px', flexShrink: 0 }}>{meta.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`, padding: '2px 8px', borderRadius: '100px' }}>
              {report.incident_type.replace('_', ' ')}
            </span>
            <span style={{ fontSize: '11px', color: C.textMuted, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MapPin size={10} /> {parseFloat(report.latitude).toFixed(4)}, {parseFloat(report.longitude).toFixed(4)}
            </span>
          </div>
          {!expanded && report.description && (
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {report.description}
            </p>
          )}
        </div>
        <div style={{ color: C.textMuted, flexShrink: 0, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
          <ChevronDown size={16} />
        </div>
      </div>
      {expanded && (
        <div className="incident-expand">
          <div style={{ height: '1px', background: meta.border, marginBottom: '10px' }} />
          {report.description
            ? <p style={{ margin: '0 0 10px', fontSize: '13px', color: C.textPrimary, lineHeight: 1.6 }}>{report.description}</p>
            : <p style={{ margin: '0 0 10px', fontSize: '13px', color: C.textMuted, fontStyle: 'italic' }}>No description provided.</p>
          }
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a className="maps-link"
              href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
              target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
              <Navigation size={11} /> View on Maps
            </a>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: C.textMuted, padding: '5px 12px', borderRadius: '100px', background: C.nudeWarm }}>
              <Clock size={11} /> {report.time_of_incident || 'Unknown time'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main App ─── */
function App() {
  const [reports, setReports] = useState([]);
  const [showOverview, setShowOverview] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState({ latitude: '', longitude: '', incident_type: 'harassment', description: '', time_of_incident: new Date().toLocaleString() });
  const [suggestions, setSuggestions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [submitState, setSubmitState] = useState('idle');
  const [safetyState, setSafetyState] = useState('idle');
  const [riskScore, setRiskScore] = useState(null);
  const [expandedSuggestions, setExpandedSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const riskWeights = { assault: 6, harassment: 5, theft: 4, poor_lighting: 3 };

  const fetchHeatmap = async () => {
    try { const res = await axios.get(`${API_BASE}/heatmap`); setReports(res.data); }
    catch (err) { console.error(err); }
  };

  useEffect(() => { fetchHeatmap(); }, []);

  useEffect(() => {
    const tag = document.createElement('style');
    tag.textContent = globalCSS;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  const handleSOS = () => {
    if (!("geolocation" in navigator)) { alert("Geolocation not supported."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setLocating(false);
      const { latitude, longitude } = coords;
      const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(`EMERGENCY! My location: ${link}`)}`, '_blank');
      setFormData(p => ({ ...p, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) }));
      if (formStep === 0) setFormStep(1);
    }, () => { setLocating(false); alert("Enable location services."); });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitState('loading');
    try {
      await axios.post(`${API_BASE}/report`, formData);
      setSubmitState('success');
      fetchHeatmap();
      setTimeout(() => { setSubmitState('idle'); setFormStep(0); setSuggestions([]); setSafetyState('idle'); }, 2800);
    } catch {
      setSubmitState('error');
      setTimeout(() => setSubmitState('idle'), 2500);
    }
  };

  function MapEvents() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setFormData(p => ({ ...p, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
        if (formStep === 0) setFormStep(1);
      },
    });
    return null;
  }

  const filteredReports = filterType === 'all' ? reports : reports.filter(r => r.incident_type === filterType);
  const hasCoords = formData.latitude && formData.longitude;
  const filterTypes = ['all', 'assault', 'harassment', 'theft', 'poor_lighting'];

  /* ── Step content ── */
  const renderStep = () => {
    if (submitState === 'success') return (
      <div style={{ textAlign: 'center', padding: '30px 0', animation: 'fadeSlideIn 0.3s ease both' }}>
        <div style={{ fontSize: '52px', marginBottom: '12px', animation: 'successBounce 0.4s ease both' }}>✅</div>
        <p style={{ color: C.safe, fontWeight: 600, margin: 0, fontSize: '16px' }}>Report submitted!</p>
        <p style={{ color: C.textMuted, fontSize: '13px', marginTop: '4px' }}>Thank you for keeping the community safe.</p>
      </div>
    );

    if (formStep === 0) return (
      <div key="s0" style={{ animation: 'stepPop 0.3s ease both' }}>
        <p style={{ fontSize: '13px', color: C.textMuted, marginBottom: '14px', lineHeight: 1.6 }}>
          Click a spot on the map, or type coordinates directly.
        </p>
        <div style={{ display: 'grid', gap: '10px' }}>
          <input className={`form-input ${formData.latitude ? 'filled' : ''}`} type="number" step="any"
            placeholder="Latitude" value={formData.latitude}
            onChange={e => setFormData({ ...formData, latitude: e.target.value })} />
          <input className={`form-input ${formData.longitude ? 'filled' : ''}`} type="number" step="any"
            placeholder="Longitude" value={formData.longitude}
            onChange={e => setFormData({ ...formData, longitude: e.target.value })} />
        </div>
        <div className={`coord-display ${hasCoords ? 'has-coords' : ''}`} style={{ marginTop: '12px' }}>
          <MapPin size={13} />
          {hasCoords
            ? <span>📍 {parseFloat(formData.latitude).toFixed(5)}, {parseFloat(formData.longitude).toFixed(5)}</span>
            : <span>No location selected — click the map above</span>}
        </div>
        <button className="primary-btn" style={{ marginTop: '14px' }} type="button" disabled={!hasCoords} onClick={() => setFormStep(1)}>
          Continue →
        </button>
      </div>
    );

    if (formStep === 1) return (
      <div key="s1" style={{ animation: 'stepPop 0.3s ease both', display: 'grid', gap: '10px' }}>
        <p style={{ fontSize: '13px', color: C.textMuted, margin: '0 0 4px', lineHeight: 1.6 }}>What kind of incident occurred?</p>
        {Object.entries(INCIDENT_META).map(([type, meta]) => (
          <label key={type} className="radio-option"
            style={{ borderColor: formData.incident_type === type ? meta.border : C.nudeDeep, background: formData.incident_type === type ? meta.bg : '#fff' }}>
            <input type="radio" name="incident_type" value={type} checked={formData.incident_type === type}
              onChange={e => setFormData({ ...formData, incident_type: e.target.value })} style={{ display: 'none' }} />
            <span style={{ fontSize: '20px' }}>{meta.emoji}</span>
            <span style={{ fontSize: '14px', fontWeight: formData.incident_type === type ? 500 : 400, color: formData.incident_type === type ? meta.color : C.textPrimary, textTransform: 'capitalize', flex: 1 }}>
              {type.replace('_', ' ')}
            </span>
            {formData.incident_type === type && <CheckCircle size={15} color={meta.color} />}
          </label>
        ))}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button className="back-btn" type="button" style={{ flex: 1 }} onClick={() => setFormStep(0)}>← Back</button>
          <button className="primary-btn" type="button" style={{ flex: 2 }} onClick={() => setFormStep(2)}>Continue →</button>
        </div>
      </div>
    );

    return (
      <div key="s2" style={{ animation: 'stepPop 0.3s ease both', display: 'grid', gap: '12px' }}>
        <p style={{ fontSize: '13px', color: C.textMuted, margin: '0 0 2px', lineHeight: 1.6 }}>Add any details to help others stay safe.</p>
        <textarea className="form-input" placeholder="Describe what happened (optional)…"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          style={{ minHeight: '86px', resize: 'vertical' }} />

        <button className="primary-btn" type="button"
          disabled={safetyState === 'loading'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={async () => {
            setSafetyState('loading');
            try {
              const res = await axios.get(`${API_BASE}/safe-route`, {
                params: { start_lat: formData.latitude, start_lng: formData.longitude, end_lat: formData.latitude, end_lng: formData.longitude }
              });
              setSafetyState(res.data.risk_score > 10 ? 'danger' : 'safe');
              setRiskScore(res.data.risk_score);
              setSuggestions(res.data.suggestions || []);
              setExpandedSuggestions(true);
            } catch { setSafetyState('error'); }
          }}>
          {safetyState === 'loading'
            ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Checking…</>
            : '🔍 Check Area Safety'}
        </button>

        {safetyState === 'safe' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', background: C.safeFaint, border: `1px solid ${C.safeBorder}`, borderRadius: '10px', animation: 'fadeSlideIn 0.25s ease both' }}>
            <CheckCircle size={16} color={C.safe} />
            <span style={{ fontSize: '13px', color: C.safe, fontWeight: 500 }}>Area appears relatively safe</span>
            {riskScore !== null && <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: C.safe, background: 'white', border: `1px solid ${C.safeBorder}`, padding: '2px 10px', borderRadius: '100px' }}>Score: {riskScore}</span>}
          </div>
        )}

        {safetyState === 'danger' && (
          <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', animation: 'fadeSlideIn 0.25s ease both' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: suggestions.length ? '8px' : 0 }}>
              <AlertTriangle size={15} color={C.danger} />
              <span style={{ fontSize: '13px', color: C.danger, fontWeight: 600 }}>High Risk Area Detected</span>
              {riskScore !== null && <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: C.danger, background: 'white', border: '1px solid #FECACA', padding: '2px 10px', borderRadius: '100px' }}>Score: {riskScore}</span>}
            </div>
            {suggestions.length > 0 && (
              <>
                <button type="button" onClick={() => setExpandedSuggestions(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: C.safe, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', padding: 0, marginBottom: expandedSuggestions ? '8px' : 0 }}>
                  {expandedSuggestions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {suggestions.length} safe alternative{suggestions.length > 1 ? 's' : ''} nearby
                </button>
                {expandedSuggestions && suggestions.map((alt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: `1px solid ${C.safeBorder}`, padding: '8px 12px', borderRadius: '8px', marginBottom: '6px', animation: `fadeSlideIn 0.2s ${i * 0.05}s ease both` }}>
                    <span style={{ fontSize: '12px', color: C.textPrimary }}>Option {i + 1} <span style={{ color: C.textMuted }}>· risk {alt.risk}</span></span>
                    <a className="navigate-link"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${alt.lat},${alt.lng}&travelmode=walking`}
                      target="_blank" rel="noreferrer">
                      <Navigation size={11} /> Navigate
                    </a>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
          <button className="back-btn" type="button" style={{ flex: 1 }} onClick={() => setFormStep(1)}>← Back</button>
          <button className="submit-btn" type="submit" style={{ flex: 2 }}>
            {submitState === 'loading' ? 'Submitting…' : submitState === 'error' ? '✕ Try again' : 'Submit Report'}
          </button>
        </div>
      </div>
    );
  };

  return (
     <>
      {showOverview && <OverviewPage onEnterPortal={() => setShowOverview(false)} />}
      {!showOverview && (
    <div style={{ maxWidth: '940px', margin: 'auto', padding: '32px 20px 60px', fontFamily: "'DM Sans', sans-serif", color: C.textPrimary }}>

      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '36px' }}>
        <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.rose }}>Community Safety Network</span>
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, fontStyle: 'italic', color: C.cherry, margin: '6px 0 4px' }}>
          <Shield size={30} color={C.cherry} /> Women Safety Portal
        </h1>
        <p style={{ fontSize: '13px', color: C.textMuted, margin: 0 }}>Report incidents · View risk heatmap · Find safe routes</p>
        <button className="heatmap-btn" onClick={() => setShowMap(v => !v)}>
          <MapIcon size={16} /> {showMap ? 'Hide Heatmap' : 'View Heatmap'}
        </button>
      </header>

      {/* Map */}
      {showMap && (
        <section style={{ marginBottom: '28px', height: '400px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(74,0,12,0.13)', border: `1px solid ${C.nudeDeep}` }}>
          <MapContainer center={[26.8467, 80.9462]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <HeatmapLayer points={reports} longitudeExtractor={m => m.longitude} latitudeExtractor={m => m.latitude}
              intensityExtractor={m => (riskWeights[m.incident_type] || 1) * 10} radius={25} blur={15} />
            <MapEvents />
            {suggestions.map((alt, i) => (
              <React.Fragment key={`alt-${i}`}>
                <Polyline positions={[[formData.latitude, formData.longitude], [alt.lat, alt.lng]]} pathOptions={{ color: C.safe, dashArray: '5,10', weight: 3 }} />
                <Circle center={[alt.lat, alt.lng]} radius={200} pathOptions={{ color: C.safe, fillColor: C.safe, fillOpacity: 0.3 }} />
                <Marker position={[alt.lat, alt.lng]}><Popup><strong>Safe Alt {i + 1}</strong><br />Risk: {alt.risk}</Popup></Marker>
              </React.Fragment>
            ))}
            {reports.map(r => (
              <Marker key={r.id} position={[r.latitude, r.longitude]}>
                <Popup><strong>{r.incident_type.toUpperCase()}</strong><br />{r.description}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </section>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: showMap ? '1fr' : '1fr 1fr', gap: '24px' }}>

        {/* ── Report Form ── */}
        <section style={{ background: C.nudeWarm, padding: '24px', borderRadius: '16px', border: `1px solid ${C.nudeDeep}`, boxShadow: '0 4px 24px rgba(74,0,12,0.07)' }}>
          <button className="sos-btn" type="button" onClick={handleSOS} disabled={locating}>
            {locating ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Locating…</> : '🚨 SEND SOS / SHARE LOCATION'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <AlertTriangle size={18} color={C.rose} />
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.15rem', fontWeight: 600, color: C.cherry, margin: 0 }}>Report an Incident</h3>
          </div>
          <StepIndicator step={formStep} />
          <form onSubmit={handleSubmit}>{renderStep()}</form>
        </section>

        {/* ── Incident List ── */}
        <section style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: `1px solid ${C.nudeDeep}`, boxShadow: '0 4px 24px rgba(74,0,12,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.15rem', fontWeight: 600, color: C.cherry, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color={C.rose} /> Recent Incidents
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 500, color: C.textMuted, background: C.nudeWarm, padding: '3px 10px', borderRadius: '100px', border: `1px solid ${C.nudeDeep}` }}>
              {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
            <Filter size={12} color={C.textMuted} style={{ flexShrink: 0 }} />
            {filterTypes.map(type => (
              <button key={type} type="button" className={`filter-chip ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}>
                {type === 'all' ? 'All' : `${INCIDENT_META[type]?.emoji} ${type.replace('_', ' ')}`}
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ maxHeight: '440px', overflowY: 'auto', paddingRight: '2px' }}>
            {filteredReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textMuted }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>
                <p style={{ margin: 0, fontSize: '13px' }}>No incidents found.</p>
              </div>
            ) : filteredReports.map((report, i) => (
              <IncidentCard key={report.id} report={report} index={i} />
            ))}
          </div>
        </section>

      </div>
    </div>
      )}
    </>
  );
}

export default App;