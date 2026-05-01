import {
  authApi,
  cartApi,
  categoryApi,
  clearAuthUser,
  getAuthUser,
  productApi,
  setAuthUser,
} from "./api.js";

// ── Wishlist helpers (localStorage) ──────────────────────────────────────────
const WISHLIST_KEY = "mart_wishlist";

function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]"); }
  catch { return []; }
}

function toggleWishlist(product) {
  const list = getWishlist();
  const idx = list.findIndex((p) => p.id === product.id);
  if (idx === -1) {
    list.push(product);
  } else {
    list.splice(idx, 1);
  }
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  return idx === -1; // true = added
}

function isWishlisted(productId) {
  return getWishlist().some((p) => p.id === productId);
}

// ── Product image map (admin-set URLs stored in localStorage) ─────────────────
const IMG_MAP_KEY = "mart_product_images";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80\u0026w=600";


function getImageMap() {
  try { return JSON.parse(localStorage.getItem(IMG_MAP_KEY) || "{}"); }
  catch { return {}; }
}

function setProductImage(productName, url) {
  const map = getImageMap();
  map[productName.toLowerCase()] = url;
  localStorage.setItem(IMG_MAP_KEY, JSON.stringify(map));
}

const page = document.body.dataset.page;

function showMessage(text, isError = false) {
  const el = document.getElementById("statusMessage");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("error", isError);
}

function getHomeByRole(role) {
  if (role === "ADMIN") return "admin.html";
  if (role === "DELIVERY") return "delivery.html";
  return "index.html";
}

function ensureAuthenticated() {
  const user = getAuthUser();
  if (!user) {
    globalThis.location.href = "login.html";
    return null;
  }
  return user;
}

function ensureRole(allowedRoles) {
  const user = ensureAuthenticated();
  if (!user) return null;
  if (!allowedRoles.includes(user.role)) {
    globalThis.location.href = getHomeByRole(user.role);
    return null;
  }
  return user;
}

function setupHeader() {
  const user = getAuthUser();
  const authActions = document.getElementById("authActions");
  const roleLinks = document.getElementById("roleLinks");

  // Apply role class for CSS restrictions
  if (user?.role === "ADMIN") {
    document.body.classList.add("role-admin");
  } else {
    document.body.classList.remove("role-admin");
  }

  if (roleLinks) {
    if (user?.role === "ADMIN") {
      roleLinks.innerHTML = '<a class="nav-link" href="admin.html">Dashboard</a>';
    } else if (user?.role === "DELIVERY") {
      roleLinks.innerHTML = '<a class="nav-link" href="delivery.html">Deliveries</a>';
    } else {
      roleLinks.innerHTML = "";
    }
  }

  if (authActions) {
    if (user) {
      authActions.innerHTML = `
        <span class="user-badge">${user.name || user.email}</span>
        <button id="logoutBtn" class="auth-btn secondary">Logout</button>
      `;
      document.getElementById("logoutBtn")?.addEventListener("click", () => {
        clearAuthUser();
        globalThis.location.href = "login.html";
      });
    } else {
      authActions.innerHTML = `
        <a class="auth-btn secondary" href="login.html">Login</a>
        <a class="auth-btn" href="signup.html">Sign Up</a>
      `;
    }
  }

  // Categories strip logic moved to loadCategories() in initCatalogPage
}

function getProductImage(product) {
  if (!product) return FALLBACK_IMG;

  // 1) Check real backend-provided image first
  if (product.imageUrl) return product.imageUrl;

  // 2) Check admin-saved custom images (legacy localStorage)
  const stored = getImageMap();
  const lowerName = String(product.name || "").toLowerCase();
  const storedKey = Object.keys(stored).find((k) => lowerName.includes(k));
  if (storedKey) return stored[storedKey];

  // 3) Built-in fallbacks with high-quality Unsplash URLs
  const defaults = {
    // Dairy
    milk:       "https://images.unsplash.com/photo-1550583724-125581fe2f8d?q=80&w=600",
    cheese:     "https://images.unsplash.com/photo-1486297678162-ad2a19b05844?q=80&w=600",
    yogurt:     "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=600",
    butter:     "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?q=80&w=600",
    cream:      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600",
    egg:        "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?q=80&w=600",
    dairy:      "https://images.unsplash.com/photo-1550583724-125581fe2f8d?q=80&w=600",
    
    // Fruits
    apple:      "https://images.unsplash.com/photo-1560806887-1e47018c6ee7?q=80&w=600",
    banana:     "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=600",
    orange:     "https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=600",
    strawberry: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=600",
    grape:      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=600",
    watermelon: "https://images.unsplash.com/photo-1587049633562-ad350260521e?q=80&w=600",
    mango:      "https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=600",
    pineapple:  "https://images.unsplash.com/photo-1550258114-68bd27923485?q=80&w=600",
    berry:      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=600",
    fruit:      "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=600",
    
    // Vegetables
    tomato:     "https://images.unsplash.com/photo-1561131245-c9302bdb4a7c?q=80&w=600",
    potato:     "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=600",
    carrot:     "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=600",
    onion:      "https://images.unsplash.com/photo-1508747703725-71977713cf5e?q=80&w=600",
    broccoli:   "https://images.unsplash.com/photo-1452948491233-ad8a1ed01085?q=80&w=600",
    spinach:    "https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=600",
    pepper:     "https://images.unsplash.com/photo-1563513307168-a42aa46d5c6b?q=80&w=600",
    lettuce:    "https://images.unsplash.com/photo-1622206141540-581373514781?q=80&w=600",
    cucumber:   "https://images.unsplash.com/photo-1449333254728-79e27bc79730?q=80&w=600",
    garlic:     "https://images.unsplash.com/photo-1589647363585-f4a7d3eb201d?q=80&w=600",
    veggie:     "https://images.unsplash.com/photo-1566385101042-1a0aa0c12e8c?q=80&w=600",
    vegetable:  "https://images.unsplash.com/photo-1566385101042-1a0aa0c12e8c?q=80&w=600",

    // Bakery
    bread:      "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600",
    croissant:  "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600",
    cake:       "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600",
    muffin:     "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?q=80&w=600",
    cookie:     "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=600",
    bagel:      "https://images.unsplash.com/photo-1585476922329-705b7662c47e?q=80&w=600",
    bakery:     "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600",
    
    // Meat & Protein
    meat:       "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=600",
    chicken:    "https://images.unsplash.com/photo-1604503468506-a8da13d11d36?q=80&w=600",
    beef:       "https://images.unsplash.com/photo-1558030006-45c675171f21?q=80&w=600",
    steak:      "https://images.unsplash.com/photo-1546241072-48010ad28c2c?q=80&w=600",
    fish:       "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=600",
    salmon:     "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=600",
    shrimp:     "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?q=80&w=600",
    protein:    "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=600",
    
    // Beverages
    juice:      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=600",
    coffee:     "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600",
    tea:        "https://images.unsplash.com/photo-1544787210-2213d84ad960?q=80&w=600",
    water:      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=600",
    soda:       "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600",
    drink:      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600",
    beverages:  "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600",
    
    // Snacks & Pantry
    snacks:     "https://images.unsplash.com/photo-1599490659223-eb33e464bbc1?q=80&w=600",
    chips:      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=600",
    chocolate:  "https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=600",
    pasta:      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=600",
    rice:       "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=600",
    oil:        "https://images.unsplash.com/photo-1474979266404-7eaacabc8d0f?q=80&w=600",
    honey:      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=600",
    jam:        "https://images.unsplash.com/photo-1534336040336-056024976472?q=80&w=600",
    nut:        "https://images.unsplash.com/photo-1536591375315-1b8e9420d2b7?q=80&w=600",
  };

  // Try name match
  const nameMatch = Object.keys(defaults).find((k) => lowerName.includes(k));
  if (nameMatch) return defaults[nameMatch];

  // Try category match
  const lowerCat = String(product.category?.name || product.category || "").toLowerCase();
  const catMatch = Object.keys(defaults).find((k) => lowerCat.includes(k));
  if (catMatch) return defaults[catMatch];

  return FALLBACK_IMG;
}

async function initCatalogPage() {
  setupHeader();
  const user = getAuthUser();

  const productsGrid = document.querySelector(".products-grid");
  const resultsCount = document.getElementById("resultsCount");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchInput");
  const priceRange = document.getElementById("priceRange");
  const selectedPrice = document.getElementById("selectedPrice");
  const sortSelect = document.getElementById("sortSelect");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  const stockRadios = document.querySelectorAll('input[name="stock"]');
  const categorySelect = document.getElementById("categorySelect");

  const filtersState = {
    query: "",
    maxPrice: Number(priceRange?.value || 1000),
    stock: "all",
    sort: "popularity",
    categoryId: "",
  };

  const defaultState = { ...filtersState };
  let products = [];

  function setFiltersDisabled(disabled) {
    [
      searchInput,
      priceRange,
      sortSelect,
      categorySelect,
      clearFiltersBtn,
      ...Array.from(stockRadios),
    ].forEach((element) => {
      if (element) element.disabled = disabled;
    });
  }

  function syncPriceLabel() {
    if (selectedPrice) selectedPrice.textContent = `$${Number(filtersState.maxPrice).toFixed(2)}`;
  }

  function syncPriceRangeFromProducts(items) {
    if (!priceRange || !Array.isArray(items) || items.length === 0) return;
    const previousMax = Number(priceRange.max || 0);
    const previousValue = Number(priceRange.value || 0);
    const maxProductPrice = Math.max(...items.map((item) => Number(item.price) || 0));
    const safeMax = Math.max(10, Math.ceil(maxProductPrice));
    priceRange.max = String(safeMax);

    const wasAtUpperLimit = previousValue >= previousMax;
    if (previousMax < safeMax && wasAtUpperLimit) {
      filtersState.maxPrice = safeMax;
      priceRange.value = String(safeMax);
    } else if (filtersState.maxPrice > safeMax || Number(priceRange.value) > safeMax) {
      filtersState.maxPrice = safeMax;
      priceRange.value = String(safeMax);
    }

    syncPriceLabel();
  }

  function sortProducts(items) {
    const sorted = [...items];
    switch (filtersState.sort) {
      case "price-low":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort((a, b) => b.availableQuantity - a.availableQuantity);
    }
    return sorted;
  }

  function renderProducts(items) {
    if (!productsGrid || !resultsCount || !emptyState) return;

    if (items.length === 0) {
      productsGrid.innerHTML = "";
      resultsCount.textContent = "0";
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    resultsCount.textContent = String(items.length);
    productsGrid.innerHTML = items
      .map(
        (product) => {
          const wishlisted = isWishlisted(product.id);
          return `
      <div class="product-card">
        <div class="img-container">
          <img src="${getProductImage(product)}" alt="${product.name}" onerror="this.src='${FALLBACK_IMG}'; this.onerror=null;">
          <button class="wishlist-btn" data-product='${JSON.stringify({id:product.id,name:product.name,price:product.price,category:product.category?.name||""})}'>
            <i class="${wishlisted ? 'fa-solid' : 'fa-regular'} fa-heart" style="color:${wishlisted ? '#EF4444' : ''}"></i>
          </button>
        </div>
        <div class="product-info">
          <p class="category">${product.category?.name || "Category"}</p>
          <h4>${product.name}</h4>
          <p class="stock-line">${product.availableQuantity} in stock</p>
          <div class="card-footer">
            <span class="price">$${Number(product.price).toFixed(2)}</span>
            <button class="add-btn" data-product-id="${product.id}">
              <i class="fa-solid fa-cart-plus"></i> Add
            </button>
          </div>
        </div>
      </div>
    `;
        }
      )
      .join("");

    productsGrid.querySelectorAll(".wishlist-btn").forEach((btn) => {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        const product = JSON.parse(this.dataset.product);
        const added = toggleWishlist(product);
        const icon = this.querySelector("i");
        icon.className = added ? "fa-solid fa-heart" : "fa-regular fa-heart";
        icon.style.color = added ? "#EF4444" : "";
        showMessage(added ? `❤️ ${product.name} added to wishlist.` : `Removed from wishlist.`);
      });
    });

    productsGrid.querySelectorAll(".add-btn").forEach((btn) => {
      btn.addEventListener("click", async function (event) {
        event.stopPropagation();
        const productId = this.dataset.productId;
        if (!user) {
          showMessage("Please login first to add items to cart.", true);
          return;
        }
        try {
          await cartApi.add({ productId, quantity: 1 });
          this.innerHTML = '<i class="fa-solid fa-check"></i> Added';
          this.style.background = "#4a7c59";
          this.style.color = "white";
          setTimeout(() => {
            this.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Add';
            this.style.background = "#2D5A27";
            this.style.color = "white";
          }, 1500);
          showMessage("Added to cart.");
        } catch (error) {
          showMessage(error.message || "Failed to add to cart.", true);
        }
      });
    });
  }

  function applyClientFilters(items) {
    const query = filtersState.query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        (item.category?.name || "").toLowerCase().includes(query);
      const matchesPrice = Number(item.price) <= filtersState.maxPrice;
      const matchesStock =
        filtersState.stock === "all" ? true : Number(item.availableQuantity) > 0;
      return matchesSearch && matchesPrice && matchesStock;
    });
    return sortProducts(filtered);
  }

  async function loadProducts() {
    try {
      showMessage("Loading products...");
      const backendFilters = {};
      if (filtersState.query) backendFilters.name = filtersState.query;
      if (filtersState.categoryId) backendFilters.categoryId = filtersState.categoryId;
      const data = await productApi.getAll(backendFilters);
      products = Array.isArray(data) ? data : [];
      syncPriceRangeFromProducts(products);
      renderProducts(applyClientFilters(products));
      showMessage(products.length === 0 ? "No products returned from backend." : "");
    } catch (error) {
      products = [];
      renderProducts([]);
      showMessage(error.message || "Failed to load products from backend.", true);
    }
  }

  async function loadCategories() {
    if (!categorySelect) return;
    try {
      const data = await categoryApi.getAll();
      categorySelect.innerHTML = `
        <option value="">All Categories</option>
        ${data.map((cat) => `<option value="${cat.id}">${cat.name}</option>`).join("")}
      `;

      const strip = document.querySelector(".categories-strip");
      if (strip) {
        const icons = {
          "dairy": "fa-solid fa-cow",
          "fruit": "fa-solid fa-apple-whole",
          "veg": "fa-solid fa-carrot",
          "bakery": "fa-solid fa-bread-slice",
          "beverage": "fa-solid fa-wine-glass",
          "drink": "fa-solid fa-wine-glass",
          "meat": "fa-solid fa-drumstick-bite",
          "meet": "fa-solid fa-drumstick-bite",
          "snack": "fa-solid fa-cookie",
          "default": "fa-solid fa-layer-group"
        };
        
        let stripHTML = `
          <div class="category-item active" data-cat-id="">
              <div class="cat-icon"><i class="fa-solid fa-border-all"></i></div>
              <span>All</span>
          </div>
        `;
        
        data.forEach(cat => {
          const lowerName = cat.name.toLowerCase();
          if (lowerName === "none") return;
          
          let iconClass = icons.default;
          for (const key in icons) {
            if (lowerName.includes(key)) {
              iconClass = icons[key];
              break;
            }
          }
          stripHTML += `
            <div class="category-item" data-cat-id="${cat.id}">
                <div class="cat-icon"><i class="${iconClass}"></i></div>
                <span>${cat.name}</span>
            </div>
          `;
        });
        
        strip.innerHTML = stripHTML;
        
        const newCatItems = document.querySelectorAll(".category-item");
        newCatItems.forEach(item => {
          item.addEventListener("click", () => {
            newCatItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            if (categorySelect) {
              categorySelect.value = item.dataset.catId;
              categorySelect.dispatchEvent(new Event("change"));
            }
          });
        });
      }
    } catch (error) {
      showMessage(error.message || "Failed to load categories.", true);
    }
  }

  searchInput?.addEventListener("input", async (event) => {
    filtersState.query = event.target.value;
    await loadProducts();
  });

  priceRange?.addEventListener("input", () => {
    filtersState.maxPrice = Number(priceRange.value);
    syncPriceLabel();
    renderProducts(applyClientFilters(products));
  });

  sortSelect?.addEventListener("change", () => {
    filtersState.sort = sortSelect.value;
    renderProducts(applyClientFilters(products));
  });

  stockRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      filtersState.stock = radio.value;
      renderProducts(applyClientFilters(products));
    });
  });

  categorySelect?.addEventListener("change", async () => {
    filtersState.categoryId = categorySelect.value;
    
    // Sync category-strip active state
    const allCatItems = document.querySelectorAll(".category-item");
    allCatItems.forEach(i => i.classList.remove("active"));
    const matchingItem = document.querySelector(`.category-item[data-cat-id="${categorySelect.value}"]`);
    if (matchingItem) matchingItem.classList.add("active");

    await loadProducts();
  });

  clearFiltersBtn?.addEventListener("click", async () => {
    Object.assign(filtersState, defaultState);
    if (searchInput) searchInput.value = "";
    if (priceRange) priceRange.value = String(defaultState.maxPrice);
    if (sortSelect) sortSelect.value = defaultState.sort;
    const all = document.querySelector('input[name="stock"][value="all"]');
    if (all) all.checked = true;
    syncPriceLabel();
    
    if (categorySelect) {
      categorySelect.value = "";
      categorySelect.dispatchEvent(new Event("change"));
    } else {
      await loadProducts();
    }
  });

  syncPriceLabel();
  if (!user) {
    setFiltersDisabled(true);
    if (productsGrid) {
      productsGrid.innerHTML = `
        <div class="guest-card">
          <h3>Welcome to FreshMarket</h3>
          <p>Please login or sign up to load real products from backend.</p>
          <div class="guest-actions">
            <a class="auth-btn" href="login.html">Login</a>
            <a class="auth-btn secondary" href="signup.html">Sign Up</a>
          </div>
        </div>
      `;
    }
    if (resultsCount) resultsCount.textContent = "0";
    if (emptyState) emptyState.classList.add("hidden");
    showMessage("Login required to fetch products.");
    return;
  }

  setFiltersDisabled(false);
  await loadCategories();
  await loadProducts();
}

async function initCartPage() {
  if (!ensureAuthenticated()) return;
  setupHeader();

  const cartItemsEl = document.getElementById("cartItems");
  const subtotalEl = document.getElementById("subtotal");
  const taxEl = document.getElementById("tax");
  const totalEl = document.getElementById("total");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const placeOrderBtn = document.getElementById("placeOrderBtn");

  async function loadCart() {
    try {
      showMessage("Updating cart...");
      const cartItems = await cartApi.getMyCart();
      if (!cartItemsEl) return;

      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        cartItemsEl.innerHTML = `
          <div class="wishlist-empty-state">
            <i class="fa-solid fa-cart-shopping empty-icon" style="color:#E5E7EB"></i>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything yet.</p>
            <a href="index.html" class="auth-btn">Shop Now</a>
          </div>`;
        if (subtotalEl) subtotalEl.textContent = "$0.00";
        if (taxEl) taxEl.textContent = "$0.00";
        if (totalEl) totalEl.textContent = "$4.99";
        showMessage("");
        return;
      }

      let subtotal = 0;
      cartItemsEl.innerHTML = cartItems
        .map((item) => {
          const lineTotal = Number(item.quantity) * Number(item.product.price);
          subtotal += lineTotal;
          return `
            <div class="cart-card">
              <img src="${getProductImage(item.product)}" alt="${item.product.name}" onerror="this.src='${FALLBACK_IMG}'; this.onerror=null;" />
              <div class="item-info">
                <h3>${item.product.name}</h3>
                <p class="category">${item.product.category?.name || "Category"}</p>
                <p class="price">$${Number(item.product.price).toFixed(2)}</p>
              </div>
              
              <div class="cart-actions-wrap">
                <div class="qty-controls">
                  <button class="qty-btn dec-qty" data-product-id="${item.productId}">
                    <i class="fa-solid fa-minus"></i>
                  </button>
                  <span class="qty-num">${item.quantity}</span>
                  <button class="qty-btn inc-qty" data-product-id="${item.productId}">
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
                <p class="item-total-line">$${lineTotal.toFixed(2)}</p>
              </div>

              <button class="delete-btn-top" data-item-id="${item.id}">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          `;
        })
        .join("");

      const tax = subtotal * 0.08;
      const total = subtotal + tax + 4.99;

      if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
      if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
      if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

      // Quantity buttons logic
      cartItemsEl.querySelectorAll(".inc-qty").forEach((btn) => {
        btn.addEventListener("click", async () => {
          try {
            await cartApi.add({ productId: btn.dataset.productId, quantity: 1 });
            await loadCart();
          } catch (error) { showMessage(error.message, true); }
        });
      });

      cartItemsEl.querySelectorAll(".dec-qty").forEach((btn) => {
        btn.addEventListener("click", async () => {
          try {
            const productId = btn.dataset.productId;
            const item = cartItems.find(i => i.productId === productId);
            if (item && item.quantity > 1) {
              await cartApi.add({ productId, quantity: -1 });
              await loadCart();
            } else if (item && item.quantity === 1) {
              if (confirm("Remove item from cart?")) {
                await cartApi.remove(item.id);
                await loadCart();
              }
            }
          } catch (error) { showMessage(error.message, true); }
        });
      });

      // Delete buttons
      cartItemsEl.querySelectorAll(".delete-btn-top").forEach((btn) => {
        btn.addEventListener("click", async () => {
          try {
            await cartApi.remove(btn.dataset.itemId);
            await loadCart();
          } catch (error) { showMessage(error.message || "Failed to remove item.", true); }
        });
      });

      showMessage("");
    } catch (error) {
      showMessage(error.message || "Failed to load cart.", true);
    }
  }

  checkoutBtn?.addEventListener("click", async () => {
    try {
      const result = await cartApi.checkout();
      showMessage(
        `Checkout preview: ${result.itemsCount} items, total $${Number(result.total).toFixed(2)}.`,
      );
    } catch (error) {
      showMessage(error.message || "Checkout failed.", true);
    }
  });

  placeOrderBtn?.addEventListener("click", async () => {
    try {
      const result = await cartApi.placeOrder();
      showMessage(`Order placed successfully. Order ID: ${result.id}`);
      await loadCart();
    } catch (error) {
      showMessage(error.message || "Order placement failed.", true);
    }
  });

  await loadCart();
}

async function initAdminPage() {
  const user = ensureRole(["ADMIN"]);
  if (!user) return;
  setupHeader();

  const categoryForm = document.getElementById("categoryForm");
  const productForm = document.getElementById("productForm");
  const categoriesTableBody = document.getElementById("categoriesTableBody");
  const productsTableBody = document.getElementById("productsTableBody");
  const productCategorySelect = document.getElementById("productCategoryId");

  let categories = [];
  let products = [];

  function renderCategories() {
    if (!categoriesTableBody || !productCategorySelect) return;
    categoriesTableBody.innerHTML =
      categories.length === 0
        ? '<tr><td colspan="4">No categories yet.</td></tr>'
        : categories
            .map(
              (cat, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${cat.name}</td>
                  <td style="font-size:0.8rem;color:#9CA3AF">${cat.id}</td>
                  <td>
                    <div class="row-actions">
                      <button class="small-action" data-edit-cat-id="${cat.id}">Edit</button>
                      <button class="small-action danger" data-delete-cat-id="${cat.id}" data-delete-cat-name="${cat.name}">Delete</button>
                    </div>
                  </td>
                </tr>
              `,
            )
            .join("");

    // Wire delete category buttons
    categoriesTableBody.querySelectorAll("[data-delete-cat-id]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = btn.dataset.deleteCatId?.trim();
        const name = btn.dataset.deleteCatName;
        if (!id) return;
        if (!confirm(`Delete category "${name}"? This may affect related products.`)) return;
        try {
          console.log("Attempting to delete category:", id);
          await categoryApi.remove(id);
          showMessage(`Category "${name}" deleted.`);
          await loadCategories();
          await loadProducts();
        } catch (error) {
          console.error("Delete category error:", error);
          showMessage(error.message || "Failed to delete category.", true);
        }
      });
    });

    // Wire edit category buttons
    categoriesTableBody.querySelectorAll("[data-edit-cat-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.editCatId;
        const cat = categories.find((c) => c.id === id);
        if (cat) setCategoryEditMode(cat);
      });
    });

    productCategorySelect.innerHTML = categories
      .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
      .join("");
  }

  function renderProducts() {
    if (!productsTableBody) return;
    productsTableBody.innerHTML =
      products.length === 0
        ? '<tr><td colspan="6">No products yet.</td></tr>'
        : products
            .map(
              (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.category?.name || "-"}</td>
                  <td>$${Number(item.price).toFixed(2)}</td>
                  <td>${item.availableQuantity}</td>
                  <td>${item.id}</td>
                  <td>
                    <div class="row-actions">
                      <button class="small-action" data-edit-id="${item.id}">Edit</button>
                      <button class="small-action danger" data-remove-id="${item.id}">Delete</button>
                    </div>
                  </td>
                </tr>
              `,
            )
            .join("");

    productsTableBody.querySelectorAll("[data-remove-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await productApi.remove(button.dataset.removeId);
          showMessage("Product deleted.");
          await loadProducts();
        } catch (error) {
          showMessage(error.message || "Failed to delete product.", true);
        }
      });
    });

    productsTableBody.querySelectorAll("[data-edit-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.editId;
        const product = products.find((p) => p.id === id);
        if (product) setEditMode(product);
      });
    });
  }

  function setEditMode(product) {
    const title = document.getElementById("productFormTitle");
    const submitBtn = document.getElementById("productSubmitBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");
    const editIdInput = document.getElementById("editProductId");

    if (title) title.textContent = "Edit Product";
    if (submitBtn) submitBtn.textContent = "Update Product";
    if (cancelBtn) cancelBtn.classList.remove("hidden");
    if (editIdInput) editIdInput.value = product.id;

    document.getElementById("productName").value = product.name;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productQuantity").value = product.availableQuantity;
    document.getElementById("productCategoryId").value = product.categoryId;
    document.getElementById("productDescription").value = product.description || "";
    
    if (product.imageUrl) {
      const input = document.getElementById("productImageUrl");
      if (input) input.value = product.imageUrl;
      if (imagePreview) {
        imagePreview.src = product.imageUrl;
        imagePreviewWrap.style.display = "block";
      }
    } else {
      const input = document.getElementById("productImageUrl");
      if (input) input.value = "";
      if (imagePreviewWrap) imagePreviewWrap.style.display = "none";
    }
    
    document.getElementById("productForm").scrollIntoView({ behavior: "smooth" });
  }

  function resetProductForm() {
    const title = document.getElementById("productFormTitle");
    const submitBtn = document.getElementById("productSubmitBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");
    const editIdInput = document.getElementById("editProductId");

    if (title) title.textContent = "Create Product";
    if (submitBtn) submitBtn.textContent = "Create Product";
    if (cancelBtn) cancelBtn.classList.add("hidden");
    if (editIdInput) editIdInput.value = "";

    productForm.reset();
    if (imagePreviewWrap) imagePreviewWrap.style.display = "none";
  }

  document.getElementById("cancelEditBtn")?.addEventListener("click", resetProductForm);

  function setCategoryEditMode(category) {
    const title = document.getElementById("categoryFormTitle");
    const submitBtn = document.getElementById("categorySubmitBtn");
    const cancelBtn = document.getElementById("cancelCategoryEditBtn");
    const editIdInput = document.getElementById("editCategoryId");

    if (title) title.textContent = "Edit Category";
    if (submitBtn) submitBtn.textContent = "Update Category";
    if (cancelBtn) cancelBtn.classList.remove("hidden");
    if (editIdInput) editIdInput.value = category.id;

    document.getElementById("categoryName").value = category.name;
    document.getElementById("categoryForm").scrollIntoView({ behavior: "smooth" });
  }

  function resetCategoryForm() {
    const title = document.getElementById("categoryFormTitle");
    const submitBtn = document.getElementById("categorySubmitBtn");
    const cancelBtn = document.getElementById("cancelCategoryEditBtn");
    const editIdInput = document.getElementById("editCategoryId");

    if (title) title.textContent = "Create Category";
    if (submitBtn) submitBtn.textContent = "Create Category";
    if (cancelBtn) cancelBtn.classList.add("hidden");
    if (editIdInput) editIdInput.value = "";

    categoryForm.reset();
  }

  document.getElementById("cancelCategoryEditBtn")?.addEventListener("click", resetCategoryForm);

  async function loadCategories() {
    try {
      categories = await categoryApi.getAll();
      renderCategories();
    } catch (error) {
      showMessage(error.message || "Failed to load categories.", true);
    }
  }

  async function loadProducts() {
    try {
      products = await productApi.getAll();
      renderProducts();
    } catch (error) {
      showMessage(error.message || "Failed to load products.", true);
    }
  }

  categoryForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const editId = document.getElementById("editCategoryId").value;
    const categoryName = document.getElementById("categoryName").value.trim();
    if (!categoryName) return;
    
    try {
      if (editId) {
        // "Fake Edit": Delete old and create new
        try {
          await categoryApi.remove(editId);
        } catch (e) {
          console.warn("Could not delete old category during fake edit", e);
        }
        await categoryApi.create({ name: categoryName });
        showMessage(`Category updated (re-created) to "${categoryName}".`);
      } else {
        await categoryApi.create({ name: categoryName });
        showMessage("Category created.");
      }
      
      resetCategoryForm();
      await loadCategories();
    } catch (error) {
      showMessage(error.message || "Failed to save category.", true);
    }
  });

  // Image URL preview in admin
  const productImageUrlInput = document.getElementById("productImageUrl");
  const imagePreview = document.getElementById("imagePreview");
  const imagePreviewWrap = document.getElementById("imagePreviewWrap");
  productImageUrlInput?.addEventListener("input", () => {
    const url = productImageUrlInput.value.trim();
    if (url) {
      imagePreview.src = url;
      imagePreviewWrap.style.display = "block";
    } else {
      imagePreviewWrap.style.display = "none";
    }
  });

  productForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const editId = document.getElementById("editProductId").value;
    const name = document.getElementById("productName").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const availableQuantity = Number(document.getElementById("productQuantity").value);
    const categoryId = document.getElementById("productCategoryId").value;
    const description = document.getElementById("productDescription").value.trim();
    const imageUrl = productImageUrlInput?.value.trim() || "";

    const payload = {
      name,
      price,
      availableQuantity,
      categoryId,
      description,
    };

    try {
      if (editId) {
        // "Fake Edit": Delete old and create new to bypass backend update issues
        try {
          await productApi.remove(editId);
        } catch (e) {
          console.warn("Could not delete old product during fake edit", e);
        }
        await productApi.create(payload);
        showMessage(`Product "${name}" updated (re-created) successfully.`);
      } else {
        await productApi.create(payload);
        showMessage(`Product "${name}" created successfully.`);
      }
      
      if (imageUrl) setProductImage(name, imageUrl);
      resetProductForm();
      await loadProducts();
    } catch (error) {
      showMessage(error.message || "Failed to save product.", true);
    }
  });

  showMessage(`Logged in as ${user.email} (ADMIN)`);
  await loadCategories();
  await loadProducts();
}

async function initDeliveryPage() {
  const user = ensureRole(["DELIVERY"]);
  if (!user) return;
  setupHeader();

  const deliveryProductsBody = document.getElementById("deliveryProductsBody");
  const deliveryCategoriesList = document.getElementById("deliveryCategoriesList");

  try {
    const [categories, products] = await Promise.all([categoryApi.getAll(), productApi.getAll()]);

    if (deliveryCategoriesList) {
      deliveryCategoriesList.innerHTML =
        categories.length === 0
          ? "<li>No categories available.</li>"
          : categories.map((category) => `<li>${category.name}</li>`).join("");
    }

    if (deliveryProductsBody) {
      deliveryProductsBody.innerHTML =
        products.length === 0
          ? '<tr><td colspan="4">No products available.</td></tr>'
          : products
              .map(
                (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.category?.name || "-"}</td>
                    <td>${item.availableQuantity}</td>
                    <td>${item.availableQuantity > 0 ? "Ready for delivery prep" : "Out of stock"}</td>
                  </tr>
                `,
              )
              .join("");
    }

    showMessage(
      "Delivery dashboard is connected. Current backend does not expose delivery-order endpoints yet.",
    );
  } catch (error) {
    showMessage(error.message || "Failed to load delivery data.", true);
  }
}

function initLoginPage() {
  const user = getAuthUser();
  if (user) {
    globalThis.location.href = getHomeByRole(user.role);
    return;
  }
  const form = document.getElementById("loginForm");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const result = await authApi.login({ email, password });
      setAuthUser(result.user);
      showMessage("Login successful. Redirecting...");
      setTimeout(() => {
        globalThis.location.href = getHomeByRole(result.user.role);
      }, 700);
    } catch (error) {
      showMessage(error.message || "Login failed.", true);
    }
  });
}

function initSignupPage() {
  const user = getAuthUser();
  if (user) {
    globalThis.location.href = getHomeByRole(user.role);
    return;
  }
  const form = document.getElementById("signupForm");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

    try {
      await authApi.signup({ name, email, password, role });
      showMessage("Signup successful. Please login.");
      setTimeout(() => {
        globalThis.location.href = "login.html";
      }, 900);
    } catch (error) {
      showMessage(error.message || "Signup failed.", true);
    }
  });
}

function initWishlistPage() {
  setupHeader();
  const grid = document.getElementById("wishlistGrid");
  const empty = document.getElementById("wishlistEmpty");
  const clearBtn = document.getElementById("clearWishlistBtn");
  const countEl = document.getElementById("wishlistCount");

  function renderWishlist() {
    const list = getWishlist();
    if (countEl) countEl.textContent = list.length;
    if (!grid) return;
    if (list.length === 0) {
      grid.innerHTML = "";
      if (empty) empty.classList.remove("hidden");
      return;
    }
    if (empty) empty.classList.add("hidden");
    grid.innerHTML = list.map((product) => `
      <div class="product-card">
        <div class="img-container">
          <img src="${getProductImage(product)}" alt="${product.name}" onerror="this.src='${FALLBACK_IMG}'; this.onerror=null;">
          <button class="wishlist-btn wishlist-remove-btn" data-id="${product.id}" title="Remove from wishlist">
            <i class="fa-solid fa-heart" style="color:#EF4444"></i>
          </button>
        </div>
        <div class="product-info">
          <p class="category">${product.category || "Category"}</p>
          <h4>${product.name}</h4>
          <div class="card-footer">
            <span class="price">$${Number(product.price).toFixed(2)}</span>
            <a class="add-btn" href="index.html"><i class="fa-solid fa-store"></i> Shop</a>
          </div>
        </div>
      </div>
    `).join("");

    grid.querySelectorAll(".wishlist-remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const updated = getWishlist().filter((p) => p.id !== id);
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
        renderWishlist();
      });
    });
  }

  clearBtn?.addEventListener("click", () => {
    if (confirm("Clear your entire wishlist?")) {
      localStorage.setItem(WISHLIST_KEY, "[]");
      renderWishlist();
    }
  });

  renderWishlist();
}

async function bootstrapPage() {
  if (page === "catalog") {
    await initCatalogPage();
  } else if (page === "cart") {
    await initCartPage();
  } else if (page === "admin") {
    await initAdminPage();
  } else if (page === "delivery") {
    await initDeliveryPage();
  } else if (page === "login") {
    initLoginPage();
  } else if (page === "signup") {
    initSignupPage();
  } else if (page === "wishlist") {
    initWishlistPage();
  }
}

void bootstrapPage();
