import React, { useEffect, useMemo, useRef, useState } from "react";
import communitySlides from "../Data/CommunitySlides";
import "../Styles/CommunitySlider.css";

export default function CommunitySlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef(null);

  const slides = useMemo(() => communitySlides.filter((slide) => slide?.image), []);

  const goToSlide = (index) => {
    if (!slides.length) return;
    const nextIndex = (index + slides.length) % slides.length;
    setActiveIndex(nextIndex);
  };

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [isPaused, slides.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !slides.length) return;

    const target = track.children[activeIndex];
    if (!target) return;

    track.scrollTo({
      left: target.offsetLeft - track.offsetLeft,
      behavior: "smooth",
    });
  }, [activeIndex, slides.length]);

  if (!slides.length) return null;

  return (
    <section
      className="community-section"
      id="community"
      aria-labelledby="community-title"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="community-heading">
        <div>
          <span className="community-eyebrow">Made by you</span>
          <h2 className="community-title" id="community-title">
            Golden Community
          </h2>
          <p className="community-subtitle">
            Recipes, serving ideas, and real feedback from our customers.
          </p>
        </div>

        <div className="community-arrows" aria-label="Slider controls">
          <button
            type="button"
            className="community-arrow"
            onClick={() => goToSlide(activeIndex - 1)}
            aria-label="Previous photo"
          >
            &#8592;
          </button>
          <button
            type="button"
            className="community-arrow"
            onClick={() => goToSlide(activeIndex + 1)}
            aria-label="Next photo"
          >
            &#8594;
          </button>
        </div>
      </div>

      <div className="community-slider-shell">
        <div className="community-track" ref={trackRef}>
          {slides.map((slide, index) => (
            <article
              className={`community-card ${index === activeIndex ? "is-active" : ""}`}
              key={slide.id ?? `${slide.title}-${index}`}
            >
              <div className="community-image-wrap">
                <img
                  className={`community-image ${slide.fit === "contain" ? "is-contain" : ""}`}
                  src={slide.image}
                  alt={slide.title || `Golden Spreads community photo ${index + 1}`}
                  loading="lazy"
                />
                {slide.type && <span className="community-tag">{slide.type}</span>}
              </div>

              {(slide.title || slide.text) && (
                <div className="community-card-copy">
                  {slide.title && <h3>{slide.title}</h3>}
                  {slide.text && <p>{slide.text}</p>}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="community-dots" aria-label="Choose a photo">
          {slides.map((slide, index) => (
            <button
              key={`dot-${slide.id ?? index}`}
              type="button"
              className={`community-dot ${index === activeIndex ? "is-active" : ""}`}
              onClick={() => goToSlide(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
