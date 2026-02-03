import ProductCard from "../Components/ProductCard";
import products from "../Data/Products";
import About from "../Pages/About";
import logo from "../Assets/pic.png";

export default function Home() {
  return (
    <main className="main">
      <header className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="brand-title">Golden Spreads</h1>

            <p className="brand-subtitle">
              Small-bacth peanut butter made with love and the finest ingredients. Bold, natural flavor in every spoon.
            </p>

            <div className="hero-row">
              <span className="pill">Premium Ingredients</span>
              <span className="pill">Small Batches</span>
              <span className="pill">Premium Taste</span>
            </div>
          </div>

          <div className="hero-logo">
            <img src={logo} alt="Golden Spreads logo" />
          </div>
        </div>
      </header>

      <section className="products-section" id="products">
        <h2 className="section-title">Our Products</h2>

        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      <About />
    </main>
  );
}
