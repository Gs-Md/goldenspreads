import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const scrollToId = (id) => {
    closeMenu();
    navigate("/");

    window.setTimeout(() => {
      if (id === "top") {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        const section = document.getElementById(id);

        if (section) {
          section.scrollIntoView({
            behavior: "smooth",
          });
        }
      }
    }, 120);
  };

  const goToRewards = () => {
    closeMenu();
    navigate("/rewards");
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">

        <div className="logo">
          <span className="logo-mark">GS</span>
          <span className="logo-text">Golden Spreads</span>
        </div>

        <button
          type="button"
          className={`nav-menu-toggle ${menuOpen ? "is-open" : ""}`}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((previous) => !previous)}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          id="primary-navigation"
          className={`nav-links ${menuOpen ? "is-open" : ""}`}
        >
          <button
            type="button"
            onClick={() => scrollToId("top")}
            className="nav-btn"
          >
            Products
          </button>

          <button
            type="button"
            onClick={() => scrollToId("about")}
            className="nav-btn"
          >
            About
          </button>

          <button
            type="button"
            onClick={goToRewards}
            className="nav-btn rewards-nav-btn"
          >
            Golden Rewards
          </button>
        </div>

      </div>
    </nav>
  );
}