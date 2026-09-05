import React, { useState } from "react";
import reportImage from "../Assets/lab-test-report.png";
import "../Styles/QualityTest.css";

export default function QualityTest() {
  const [open, setOpen] = useState(false);

  return (
    <section className="quality-section" id="quality">
      <div className="quality-heading">
        <span className="quality-eyebrow">Lab Tested</span>
        <h2 className="section-title">Tested for Quality &amp; Safety</h2>
        <p className="quality-subtitle">
          Our peanut butter sample was microbiologically tested at the Chamber of
          Commerce, Industry &amp; Agriculture in Sidon and South Lebanon.
        </p>
      </div>

      <div className="quality-grid">
        <button
          className="quality-report-card"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open microbiological test report"
        >
          <img
            src={reportImage}
            alt="Microbiological test report from the Chamber of Commerce, Industry and Agriculture in Sidon and South Lebanon"
          />
          <span className="quality-view-label">View full report</span>
        </button>

        <div className="quality-results-card">
          <h3>Microbiological Test Results</h3>

          <ul className="quality-results-list">
            <li><span className="quality-check">✓</span><span><strong>Salmonella:</strong> Absent</span></li>
            <li><span className="quality-check">✓</span><span><strong>E. coli:</strong> &lt; 10 CFU/g</span></li>
            <li><span className="quality-check">✓</span><span><strong>Total coliforms:</strong> &lt; 10 CFU/g</span></li>
            <li><span className="quality-check">✓</span><span><strong>Anaerobic count:</strong> 10 CFU/g</span></li>
            <li><span className="quality-check">✓</span><span><strong>Result:</strong> Compliant with referenced standards</span></li>
          </ul>

          <p className="quality-note">Results relate to the submitted sample.</p>

          <button className="quality-button" type="button" onClick={() => setOpen(true)}>
            View Report
          </button>
        </div>
      </div>

      {open && (
        <div className="quality-modal" role="dialog" aria-modal="true" aria-label="Microbiological test report">
          <button
            type="button"
            className="quality-modal-backdrop"
            onClick={() => setOpen(false)}
            aria-label="Close report"
          />
          <div className="quality-modal-content">
            <button
              type="button"
              className="quality-modal-close"
              onClick={() => setOpen(false)}
              aria-label="Close report"
            >
              ×
            </button>
            <img src={reportImage} alt="Full microbiological test report" />
          </div>
        </div>
      )}
    </section>
  );
}
