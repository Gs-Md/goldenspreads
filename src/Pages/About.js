import React from "react";
import "../Styles/About.css";

export default function About() {
  return (
    <section className="about-section" id="about">
      <h2 className="section-title">Our Story</h2>

      <p className="about-text">
        Golden Spreads started as a simple homemade experiment — roasting peanuts,
        testing textures, and chas.ing the perfect spoonful. Every jar is made in
        small batches using clean ingredients
        Golden peanut butter Spreads, done right.
      </p>

      <div className="about-highlights">
        <div className="about-card">
          <h3>Small Batches</h3>
          <p>Freshly made for better texture and consistent quality.</p>
        </div>

        <div className="about-card">
          <h3>Premium Ingredients</h3>
          <p>Balanced Ingredients designed to fuel your day</p>
        </div>

        <div className="about-card">
          <h3>Made for daily life</h3>
          <p>Perfect for toast, oats, smoothies, baking, and snacks.</p>
        </div>
      </div>
    </section>
  );
}