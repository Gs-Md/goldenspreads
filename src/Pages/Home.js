import React, { useEffect, useRef } from "react";

import ProductCard from "../Components/ProductCard";
import products from "../Data/Products";
import About from "./About";
import CommunitySlider from "../Components/CommunitySlider";
import QualityTest from "../Components/QualityTest";
import "../Assets/jar.png";
import "../Styles/Home.css";

const heroProducts = [
  {
    product: products[0],
    className: "gs-hero-jar gs-hero-jar--left",
  },
  {
    product: products[2],
    className: "gs-hero-jar gs-hero-jar--main",
  },
  {
    product: products[3],
    className: "gs-hero-jar gs-hero-jar--right",
  },
].filter(({ product }) => product);

export default function Home() {
  const heroVisualRef = useRef(null);

  // Homepage theme and scroll animations
  useEffect(() => {
    document.body.classList.add("gs-home-theme");

    const elements = document.querySelectorAll(".gs-reveal");

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => {
        element.classList.add("is-visible");
      });

      return () => {
        document.body.classList.remove("gs-home-theme");
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -45px 0px",
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      document.body.classList.remove("gs-home-theme");
    };
  }, []);

  // Interactive 3D movement for the hero composition
  const handleHeroPointerMove = (event) => {
    if (event.pointerType === "touch") return;

    const visual = heroVisualRef.current;

    if (!visual) return;

    const rect = visual.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const pointerX = (x - 0.5) * 2;
    const pointerY = (y - 0.5) * 2;

    visual.style.setProperty("--pointer-x", pointerX.toFixed(3));
    visual.style.setProperty("--pointer-y", pointerY.toFixed(3));

    visual.style.setProperty("--pointer-left", `${x * 100}%`);
    visual.style.setProperty("--pointer-top", `${y * 100}%`);
  };

  const resetHeroPointer = () => {
    const visual = heroVisualRef.current;

    if (!visual) return;

    visual.style.setProperty("--pointer-x", "0");
    visual.style.setProperty("--pointer-y", "0");

    visual.style.setProperty("--pointer-left", "50%");
    visual.style.setProperty("--pointer-top", "50%");
  };

  return (
    <main className="main gs-home">

      {/* =====================================
          CINEMATIC HERO
      ===================================== */}

      <section className="gs-hero" id="top">

        <div className="gs-hero-background" aria-hidden="true">
          <div className="gs-hero-grain" />
          <div className="gs-hero-gridlines" />
          <div className="gs-hero-light gs-hero-light--one" />
          <div className="gs-hero-light gs-hero-light--two" />
        </div>

        <div className="gs-hero-topline">
          <span>GOLDEN SPREADS</span>
          <span>CRAFTED FOR YOUR EVERYDAY</span>
        </div>

        <div className="gs-hero-grid">

          {/* LEFT SIDE */}

          <div className="gs-hero-copy">

            <div className="gs-hero-kicker">
              <span className="gs-kicker-dot" />
              SMALL BATCH. BIG ON FLAVOUR.
              <span className="gs-kicker-line" />
            </div>

            <h1>
              Make every
              <br />
              <em>spoon</em>
              <br />
              <span className="gs-heading-outline">golden.</span>
            </h1>

            <p className="gs-hero-description">
              Discover peanut butter made for the moments
              worth savouring. Simple ingredients, beautiful
              blends, and a little golden magic in every jar.
            </p>

            <div className="gs-hero-actions">

              <a href="#products" className="gs-button-primary">
                <span>Explore our spreads</span>
                <span className="gs-button-arrow">↗</span>
              </a>

              <a href="#about" className="gs-button-secondary">
                <span className="gs-secondary-icon">✦</span>
                Discover our story
              </a>

            </div>

            <div className="gs-hero-stats">

              <div className="gs-stat">
                <strong>05</strong>
                <span>Signature blends</span>
              </div>

              <div className="gs-stat">
                <strong>300g</strong>
                <span>In every jar</span>
              </div>

              <div className="gs-stat">
                <strong>$4+</strong>
                <span>Starting price</span>
              </div>

            </div>

            <div className="gs-hero-note">
              <span className="gs-note-line" />
              A LITTLE GOLDEN JOY, EVERY DAY.
            </div>

          </div>

          {/* RIGHT SIDE — INTERACTIVE PRODUCT DISPLAY */}

          <div
            className="gs-hero-visual"
            ref={heroVisualRef}
            onPointerMove={handleHeroPointerMove}
            onPointerLeave={resetHeroPointer}
          >

            <div className="gs-visual-halo" />
            <div className="gs-cursor-light" />

            <div className="gs-visual-ring gs-visual-ring-one" />
            <div className="gs-visual-ring gs-visual-ring-two" />
            <div className="gs-visual-ring gs-visual-ring-three" />

            <div className="gs-orbit-dot gs-orbit-dot--one" />
            <div className="gs-orbit-dot gs-orbit-dot--two" />

            <div className="gs-floating-label">
              <span>THE</span>
              GOLDEN COLLECTION
              <span className="gs-floating-label-star">✦</span>
            </div>

            {/* Decorative floating particles */}

            <span className="gs-particle gs-particle--one" />
            <span className="gs-particle gs-particle--two" />
            <span className="gs-particle gs-particle--three" />
            <span className="gs-particle gs-particle--four" />
            <span className="gs-particle gs-particle--five" />

            {/* Actual product images */}

            {heroProducts.map(({ product, className }) => (
              <div className={className} key={product.id}>

                <img
                  src={product.image}
                  alt={product.name}
                  loading="eager"
                  decoding="async"
                />

              </div>
            ))}

            <div className="gs-hero-seal">
              <span>MADE</span>
              <strong>WITH</strong>
              <span>LOVE ✦</span>
            </div>

            <div className="gs-visual-caption">
              <span>01 — THE COLLECTION</span>
              <span>GOODNESS IN EVERY SPOON</span>
            </div>

            <div className="gs-visual-index">01 / 05</div>

          </div>

        </div>

        {/* BOTTOM STRIP */}

        <div className="gs-hero-bottom">

          <span>REAL INGREDIENTS</span>
          <span className="gs-bottom-star">✳</span>

          <span>BEAUTIFULLY CRAFTED</span>
          <span className="gs-bottom-star">✳</span>

          <span>MADE TO BE SHARED</span>

          <a href="#products">
            SCROLL TO EXPLORE ↓
          </a>

        </div>

      </section>

      {/* =====================================
          ANIMATED BRAND MARQUEE
      ===================================== */}

      <div className="gs-marquee" aria-hidden="true">

        <div className="gs-marquee-track">

          {[0, 1].map((item) => (
            <div className="gs-marquee-group" key={item}>

              <span>GOODNESS IN EVERY SPOON</span>
              <b>✳</b>

              <span>SMALL BATCHES</span>
              <b>✳</b>

              <span>SIMPLE INGREDIENTS</span>
              <b>✳</b>

              <span>MADE TO SPREAD JOY</span>
              <b>✳</b>

            </div>
          ))}

        </div>

      </div>

      {/* =====================================
          PRODUCT COLLECTION
      ===================================== */}

      <section
        className="products-section gs-products gs-reveal"
        id="products"
      >

        <div className="gs-section-heading">

          <div>

            <span className="gs-section-eyebrow">
              THE GOLDEN COLLECTION
            </span>

            <h2 className="gs-section-title">
              Find your <em>favourite.</em>
            </h2>

            <p className="gs-section-description">
              Five delicious ways to make your everyday a little better.
            </p>

          </div>

          <span className="gs-product-count">
            {String(products.length).padStart(2, "0")} / SIGNATURE SPREADS
          </span>

        </div>

        <div className="products-grid">

          {products.map((product, index) => (
            <div
              className="gs-product-item gs-reveal"
              key={product.id}
              style={{
                "--reveal-delay": `${index * 100}ms`,
              }}
            >

              <ProductCard product={product} />

            </div>
          ))}

        </div>

      </section>

      {/* =====================================
          BRAND STORY
      ===================================== */}

      <section className="gs-ingredient-story gs-reveal">

        <div className="gs-story-background" aria-hidden="true">
          <div className="gs-story-orb" />
          <div className="gs-story-circle" />
        </div>

        <div className="gs-story-heading">

          <span>THE ART OF A GOOD SPREAD</span>

          <h2>
            Nothing complicated.
            <br />
            Just <em>goodness.</em>
          </h2>

          <p>
            From classic roasted peanuts to naturally sweet
            combinations, discover a spread for every mood
            and every moment.
          </p>

        </div>

        <div className="gs-story-cards">

          <article className="gs-story-card">
            <span>01 / THE CLASSIC</span>
            <div className="gs-story-icon">✳</div>
            <h3>Peanuts first.</h3>
            <p>
              The foundation of our classic creamy and
              crunchy peanut butter.
            </p>
            <div className="gs-story-card-line" />
          </article>

          <article className="gs-story-card">
            <span>02 / THE SWEET SIDE</span>
            <div className="gs-story-icon">✧</div>
            <h3>Naturally sweet.</h3>
            <p>
              Discover delicious combinations featuring
              dates and cocoa.
            </p>
            <div className="gs-story-card-line" />
          </article>

          <article className="gs-story-card">
            <span>03 / YOUR MOMENT</span>
            <div className="gs-story-icon">◇</div>
            <h3>Made for you.</h3>
            <p>
              Enjoy your favourite spreads on toast,
              smoothies, oats and more.
            </p>
            <div className="gs-story-card-line" />
          </article>

        </div>

        <div className="gs-story-footer">
          <span>GOLDEN SPREADS</span>
          <span>GOOD FOOD. GOOD MOOD.</span>
        </div>

      </section>

      {/* =====================================
          FINAL PRODUCT CALL TO ACTION
      ===================================== */}

      <section className="gs-last-call gs-reveal">

        <div className="gs-last-call-decoration" aria-hidden="true">
          <span>✳</span>
          <span>✧</span>
          <span>◇</span>
        </div>

        <div className="gs-last-call-content">

          <span className="gs-section-eyebrow">
            YOUR NEXT FAVOURITE SPOON
          </span>

          <h2>
            Life tastes better
            <br />
            with a little <em>golden.</em>
          </h2>

          <p>
            Find your favourite blend and make every bite
            a little more special.
          </p>

          <a href="#products" className="gs-button-primary">
            <span>Find your favourite</span>
            <span className="gs-button-arrow">↗</span>
          </a>

        </div>

      </section>

      {/* =====================================
          EXISTING FUNCTIONAL SECTIONS
      ===================================== */}

      <div className="gs-existing-sections">

        <div className="gs-existing-block gs-reveal">
          <About />
        </div>

        <div className="gs-existing-block gs-reveal">
          <QualityTest />
        </div>

        <div className="gs-existing-block gs-reveal">
          <CommunitySlider />
        </div>

      </div>

    </main>
  );
}