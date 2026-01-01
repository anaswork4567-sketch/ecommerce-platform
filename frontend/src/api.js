const API_BASES = {
  products: "http://localhost:8000",
  users: "http://localhost:8000",
  orders: "http://localhost:8000",
  payments: "http://localhost:8000",
};

export async function fetchProducts() {
  const res = await fetch(`${API_BASES.products}/products`);
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASES.users}/users`);
  return res.json();
}

export async function fetchOrders() {
  const res = await fetch(`${API_BASES.orders}/orders`);
  return res.json();
}

export async function fetchPayments() {
  const res = await fetch(`${API_BASES.payments}/payments`);
  return res.json();
}
