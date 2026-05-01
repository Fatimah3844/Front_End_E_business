const API_BASE_URL = "http://localhost:3000";
const AUTH_STORAGE_KEY = "mart_auth_user";

function getAuthUser() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function setAuthUser(user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function clearAuthUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function buildHeaders(requireAuth = false) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (requireAuth) {
    const auth = getAuthUser();
    if (!auth?.id || !auth?.email || !auth?.role) {
      throw new Error("You need to login first.");
    }
    headers["x-user-id"] = auth.id;
    headers["x-user-email"] = auth.email;
    headers["x-role"] = auth.role;
  }

  return headers;
}

async function request(path, options, requireAuth = false) {
  const requestOptions = options || {};
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      ...buildHeaders(requireAuth),
      ...(requestOptions.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) || `Request failed (${response.status})`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return data;
}

const authApi = {
  signup(payload) {
    return request("/user/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload) {
    return request("/user/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

const categoryApi = {
  getAll() {
    return request("/category", {}, true);
  },
  create(payload) {
    return request(
      "/category",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },
  update(id, payload) {
    return request(
      `/category/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },
  remove(id) {
    return request(
      `/category/${id}`,
      {
        method: "DELETE",
      },
      true,
    );
  },
};

const productApi = {
  getAll(filters = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });
    const queryString = query.toString();
    const path = queryString ? `/product?${queryString}` : "/product";
    return request(path, {}, true);
  },
  getById(id) {
    return request(`/product/${id}`, {}, true);
  },
  create(payload) {
    return request(
      "/product",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },
  update(id, payload) {
    return request(
      `/product/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },
  remove(id) {
    return request(
      `/product/${id}`,
      {
        method: "DELETE",
      },
      true,
    );
  },
};

const cartApi = {
  getMyCart() {
    return request("/cart", {}, true);
  },
  add(payload) {
    return request(
      "/cart/add",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },
  remove(cartItemId) {
    return request(
      `/cart/${cartItemId}`,
      {
        method: "DELETE",
      },
      true,
    );
  },
  checkout() {
    return request(
      "/cart/checkout",
      {
        method: "POST",
      },
      true,
    );
  },
  placeOrder() {
    return request(
      "/cart/order",
      {
        method: "POST",
      },
      true,
    );
  },
};

export {
  API_BASE_URL,
  AUTH_STORAGE_KEY,
  authApi,
  categoryApi,
  productApi,
  cartApi,
  getAuthUser,
  setAuthUser,
  clearAuthUser,
};
