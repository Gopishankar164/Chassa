import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useCart } from "../context/CartContext";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import API_BASE_URL from "../config/api";
import "./ShopPage.css";

const PRODUCTS_PER_PAGE = 16;

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Read URL params
  useEffect(() => {
    const search = searchParams.get("search") || "";
    const cat = searchParams.get("cat") || "all";
    setSearchQuery(search);
    setSelectedCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const [productsRes, catsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products?page=0&size=${PRODUCTS_PER_PAGE}`),
          fetch(`${API_BASE_URL}/api/products/categories`).catch(() => null)
        ]);
        if (productsRes.ok) {
          const data = await productsRes.json();
          const arr = Array.isArray(data) ? data : [];
          setProducts(arr);
          setFiltered(arr);
          setTotalCount(arr.length);
          setHasMore(arr.length === PRODUCTS_PER_PAGE);
        }
        if (catsRes?.ok) {
          const catData = await catsRes.json();
          setCategories(catData?.categories || []);
        }
      } catch { }
      setLoading(false);
    };
    fetchInitial();
  }, []);

  // Filter + sort
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (searchQuery.trim() || selectedCategory !== "all") {
        try {
          setLoading(true);
          let url = `${API_BASE_URL}/api/products/search?`;
          if (searchQuery.trim()) url += `query=${encodeURIComponent(searchQuery)}&`;
          if (selectedCategory !== "all") url += `category=${encodeURIComponent(selectedCategory)}&`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            let results = data.products || data;
            results = applySort(results, sortBy);
            setFiltered(results);
          } else {
            let f = products;
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              f = f.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q) ||
                p.brand?.toLowerCase().includes(q)
              );
            }
            if (selectedCategory !== "all") {
              f = f.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());
            }
            setFiltered(applySort(f, sortBy));
          }
        } catch { }
        setLoading(false);
      } else {
        setFiltered(applySort([...products], sortBy));
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedCategory, sortBy, products]);

  function applySort(arr, sort) {
    if (sort === "price-asc") return [...arr].sort((a, b) => (a.discountedPrice || a.price) - (b.discountedPrice || b.price));
    if (sort === "price-desc") return [...arr].sort((a, b) => (b.discountedPrice || b.price) - (a.discountedPrice || a.price));
    if (sort === "discount") return [...arr].sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    return arr;
  }

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`${API_BASE_URL}/api/products?page=${nextPage}&size=${PRODUCTS_PER_PAGE}`);
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        if (arr.length > 0) {
          setProducts(prev => [...prev, ...arr]);
          setPage(nextPage);
          setHasMore(arr.length === PRODUCTS_PER_PAGE);
          setTotalCount(prev => prev + arr.length);
        } else {
          setHasMore(false);
        }
      }
    } catch { }
    setLoadingMore(false);
  };

  const handleAddToCart = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { from: `/product/${product.id}` } });
      return;
    }
    const success = await addToCart({ ...product, quantity: 1 });
    if (!success) navigate("/login");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("default");
    navigate("/home");
  };

  const getImg = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
    if (product.images?.front) return product.images.front;
    return "https://via.placeholder.com/300x400?text=No+Image";
  };

  const isFiltered = searchQuery || selectedCategory !== "all" || sortBy !== "default";

  return (
    <>
      <Navbar />
      <main className="shop-page page-content">
        {/* Shop Header */}
        <div className="shop-header">
          <div className="container">
            <div className="shop-header-inner">
              <div>
                <h1 className="shop-title">
                  {selectedCategory !== "all" ? selectedCategory : "All Products"}
                </h1>
                <p className="shop-count">
                  {filtered.length} products {searchQuery && `for "${searchQuery}"`}
                </p>
              </div>
              <div className="shop-controls">
                {/* Search */}
                <div className="shop-search-wrap">
                  <Search size={16} className="shop-search-icon" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="shop-search-input"
                  />
                  {searchQuery && (
                    <button className="shop-search-clear" onClick={() => setSearchQuery("")}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div className="sort-wrap">
                  <select
                    className="sort-select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    <option value="default">Sort: Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="discount">Best Discount</option>
                  </select>
                  <ChevronDown size={14} className="sort-icon" />
                </div>

                {/* Filter btn (mobile) */}
                <button className="filter-btn" onClick={() => setFiltersOpen(!filtersOpen)}>
                  <SlidersHorizontal size={16} />
                  Filters
                </button>

                {/* Clear */}
                {isFiltered && (
                  <button className="clear-btn" onClick={clearFilters}>
                    <X size={14} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Category pills */}
            {categories.length > 0 && (
              <div className="category-pills">
                <button
                  className={`pill ${selectedCategory === "all" ? "active" : ""}`}
                  onClick={() => { setSelectedCategory("all"); navigate("/home"); }}
                >All</button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`pill ${selectedCategory === cat ? "active" : ""}`}
                    onClick={() => { setSelectedCategory(cat); navigate(`/home?cat=${cat}`); }}
                  >{cat}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="container shop-body">
          {loading ? (
            <div className="products-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="product-skeleton">
                  <div className="skel-img" />
                  <div className="skel-text" />
                  <div className="skel-text short" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Search size={48} strokeWidth={1} />
              <h3>No products found</h3>
              <p>Try different keywords or browse all categories</p>
              <button className="btn-primary" onClick={clearFilters}>Browse All</button>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {filtered.map(product => {
                  const imgSrc = getImg(product);
                  const hasDiscount = product.isDiscountActive && product.discountedPrice && product.discountedPrice < product.price;
                  return (
                    <Link to={`/product/${product.id}`} key={product.id} className="product-card-link">
                      <div className="product-card-v2">
                        <div className="pc-img-wrap">
                          <img src={imgSrc} alt={product.name} loading="lazy" onError={(e) => { e.target.src = "https://placehold.co/300x400/png?text=No+Image"; }} />
                          {hasDiscount && <span className="pc-discount">{product.discountPercentage}% OFF</span>}

                        </div>
                        <div className="pc-info">
                          <p className="pc-brand">{product.brand || product.category}</p>
                          <h3 className="pc-name">{product.name}</h3>
                          <div className="pc-price">
                            <span className="pc-price-current">
                              ₹{hasDiscount ? product.discountedPrice : product.price}
                            </span>
                            {hasDiscount && (
                              <span className="pc-price-original">₹{product.price}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Load more */}
              {!searchQuery && selectedCategory === "all" && hasMore && (
                <div className="load-more-wrap">
                  <button className="btn-outline" onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? "Loading..." : "Load More Products"}
                  </button>
                </div>
              )}
              {!hasMore && totalCount > 0 && !searchQuery && selectedCategory === "all" && (
                <p className="all-loaded">You've seen all {totalCount} products ✓</p>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
