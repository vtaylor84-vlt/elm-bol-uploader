import React, { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShowcase } from '../../context/ShowcaseContext.tsx';
import { SCENARIO_OPTIONS } from '../../types/showcase.ts';
import { personaFor, CARRIER_DEMO_CONFIG } from '../../fixtures/showcase/personas.ts';
import type { CarrierId, ScenarioId, ShowcasePersonaRole } from '../../types/showcase.ts';

/**
 * Compact Showcase chrome: persistent DEMO indicator + drawer for admin Demo controls.
 * Replaces the always-expanded Scenario Control Panel so demo UI does not dominate the driver workspace.
 */
const DemoControls: React.FC = () => {
  const navigate = useNavigate();
  const { state, setCarrier, setPersonaRole, setScenario, resetShowcase, exitShowcase } =
    useShowcase();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const persona = personaFor(state.carrierId, state.personaRole);
  const carrierName = CARRIER_DEMO_CONFIG[state.carrierId].displayName;
  const scenarioLabel =
    SCENARIO_OPTIONS.find((o) => o.id === state.scenarioId)?.label || state.scenarioId;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleExit = () => {
    exitShowcase();
    navigate('/home', { replace: true });
  };

  return (
    <div className="demo-chrome">
      <div className="demo-chrome-bar" role="status" aria-label="Demonstration data active">
        <div className="demo-chrome-bar-main">
          <span className="demo-chrome-pill">DEMO — SHOWCASE</span>
          <span className="demo-chrome-meta">
            {carrierName} · {persona.displayName} · {scenarioLabel}
          </span>
        </div>
        <div className="demo-chrome-actions">
          <button
            type="button"
            className="demo-chrome-btn"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
          >
            Demo controls
          </button>
          <button type="button" className="demo-chrome-btn demo-chrome-btn--exit" onClick={handleExit}>
            Exit Showcase
          </button>
        </div>
      </div>

      {open ? (
        <div
          id={panelId}
          className="demo-controls-drawer"
          role="dialog"
          aria-modal="false"
          aria-label="Demo controls"
        >
          <div className="demo-controls-drawer-head">
            <p className="demo-controls-drawer-title">Demo controls</p>
            <button
              ref={closeRef}
              type="button"
              className="demo-chrome-btn"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          <p className="demo-controls-note">
            Demonstration data only. Changes apply across Showcase destinations. No production
            writes, emails, or payments.
          </p>

          <div className="demo-controls-grid">
            <label className="demo-controls-field">
              <span>Carrier</span>
              <select
                value={state.carrierId}
                onChange={(e) => setCarrier(e.target.value as CarrierId)}
              >
                <option value="GLX">Greenleaf Xpress (GLX)</option>
                <option value="BST">BST Expedite (BST)</option>
              </select>
            </label>

            <label className="demo-controls-field">
              <span>View as</span>
              <select
                value={state.personaRole}
                onChange={(e) => setPersonaRole(e.target.value as ShowcasePersonaRole)}
              >
                <option value="driver">Driver — {personaFor(state.carrierId, 'driver').displayName}</option>
                <option value="admin">Admin preview — {personaFor(state.carrierId, 'admin').displayName}</option>
              </select>
            </label>

            <label className="demo-controls-field demo-controls-field--wide">
              <span>Scenario</span>
              <select
                value={state.scenarioId}
                onChange={(e) => setScenario(e.target.value as ScenarioId)}
              >
                {SCENARIO_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="demo-controls-footer">
            <button
              type="button"
              className="demo-chrome-btn"
              onClick={() => {
                resetShowcase();
                setOpen(false);
              }}
            >
              Reset demonstration
            </button>
            <button type="button" className="demo-chrome-btn demo-chrome-btn--exit" onClick={handleExit}>
              Exit Showcase
            </button>
          </div>

          <p className="demo-controls-security">
            View As changes the previewed persona and permissions surface. It does not change the
            data environment. Showcase remains isolated from Production. Sensitive mutations stay
            blocked.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default DemoControls;
