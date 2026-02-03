import React from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();

  const scrollToId = (id) => {
    navigate("/");

    setTimeout(() => {
      if (id === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const section = document.getElementById(id);
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      }
    }, 100);
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <div className="logo">
          <span className="logo-mark">GS</span>
          <span className="logo-text">Golden Spreads</span>
        </div>

        <div className="nav-links">
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
        </div>
      </div>
    </nav>
  );
}