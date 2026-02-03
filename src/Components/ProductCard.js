import React from "react";
import "../Styles/ProductCard.css";

export default function ProductCard({ product }) {
  return (
    <div className="product-card">
      {product.featured && <div className="ribbon">BEST SELLER</div>}

      <div className="product-image-wrap">
        <img className="product-image" src={product.image} alt={product.name} />
      </div>

      <div className="product-body">
        <div className="product-top">
          <h3 className="product-name">{product.name}</h3>

          <div className="product-meta">
            <span className="product-price">{product.price}</span>
            <span className="product-weight">{product.weight}</span>
          </div>
        </div>

        <p className="product-ingredients">
          <span className="label">Ingredients:</span> {product.ingredients}
        </p>

        <div className="product-tags">
          {product.info.map((tag, idx) => (
            <span key={idx} className="tag">
              {tag}
            </span>
          ))}
        </div>

        <p className="product-bestuse">
          <span className="label">Best use:</span> {product.bestUse}
        </p>
      </div>

      <div className="product-accent" />
    </div>
  );
}
