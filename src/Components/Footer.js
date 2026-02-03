import React from "react";
import InstagramIcon from "@mui/icons-material/Instagram";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import "../Styles/Footer.css";

/* TikTok SVG (MUI does NOT provide TikTok) */
const TikTokIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12.9 2h2.1c.2 1.5 1.1 3 2.6 3.8 1 .5 2 .8 3.1.8v2.1c-1.5 0-3-.4-4.3-1.2-.6-.4-1.1-.8-1.5-1.3v8.7c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6c.3 0 .6 0 .9.1v2.2c-.3-.1-.6-.2-.9-.2-2.1 0-3.9 1.7-3.9 3.9s1.7 3.9 3.9 3.9 3.9-1.7 3.9-3.9V2z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-inner">
        <div className="footer-title">Golden Spreads</div>
        <div className="footer-sub">
          Homemade peanut butter • Small batches • Made with love
        </div>

        <div className="socialMedia">
          <a
            href="https://www.instagram.com/goldenspreads.lb?igsh=MjRodGgxY2Zkb3Iy&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <InstagramIcon />
          </a>

          <a
            href="https://wa.me/96176586493"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
          >
            <WhatsAppIcon />
          </a>

          <a
            href="https://www.tiktok.com/@golden.spreads"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
          >
            <TikTokIcon />
          </a>
        </div>

        <p className="footer-copy">© 2026 Golden Spreads</p>
      </div>
    </footer>
  );
}