let products = [];
let favoriteIds = [];
try { favoriteIds = JSON.parse(localStorage.getItem("bazarViralFavorites") || "[]"); } catch {}

const grid = document.querySelector("#productGrid");
const searchInput = document.querySelector("#searchInput");
const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");
const toast = document.querySelector("#toast");
const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
let category = "todos";

function escapeHTML(value) { return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }
function normalizedName(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim(); }
function categoryKey(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/\s+/g, "-"); }
function notify(message) { toast.textContent = message; toast.classList.add("show"); clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove("show"), 2200); }

function card(product) {
  const saved = favoriteIds.includes(product.id);
  const href = product.real ? `producto.html?real=${encodeURIComponent(product.id)}` : `producto.html?id=${encodeURIComponent(product.id)}`;
  return `<article class="product-card ${product.real ? "real-product" : "demo-product"}" data-category="${escapeHTML(product.category)}"><div class="product-art" style="background:linear-gradient(145deg,${product.colors[0]},${product.colors[1]})"><span class="product-badge">${escapeHTML(product.badge)}</span><button class="favorite ${saved ? "saved" : ""}" data-id="${escapeHTML(product.id)}" aria-label="Guardar ${escapeHTML(product.name)}">${saved ? "♥" : "♡"}</button><a class="product-link" href="${href}"><span class="emoji" aria-hidden="true">${escapeHTML(product.emoji)}</span></a></div><div class="product-copy"><small>${escapeHTML(product.seller)} · ${product.real ? "Producto aprobado" : "Ejemplo"}</small><h3><a class="product-link" href="${href}">${escapeHTML(product.name)}</a></h3><div class="price-row"><span class="price">${money.format(product.price)}</span><button class="add-button" data-id="${escapeHTML(product.id)}" data-product="${escapeHTML(product.name)}" data-real="${product.real ? "true" : "false"}">${product.real ? "VER PRODUCTO" : "AGREGAR DEMO"}</button></div></div></article>`;
}

function render() {
  const term = searchInput.value.trim().toLocaleLowerCase("es");
  const visible = products.filter(product => (category === "todos" || product.category === category) && product.name.toLocaleLowerCase("es").includes(term));
  grid.innerHTML = visible.map(card).join("");
  resultCount.textContent = `${visible.length} ${visible.length === 1 ? "hallazgo" : "hallazgos"}`;
  emptyState.hidden = visible.length !== 0;
  bindCards();
}

function bindCards() {
  document.querySelectorAll(".favorite").forEach(button => button.addEventListener("click", () => {
    button.classList.toggle("saved"); const saved = button.classList.contains("saved"); button.textContent = saved ? "♥" : "♡";
    favoriteIds = saved ? [...new Set([...favoriteIds, button.dataset.id])] : favoriteIds.filter(id => id !== button.dataset.id);
    localStorage.setItem("bazarViralFavorites", JSON.stringify(favoriteIds)); notify(saved ? "Guardado en favoritos" : "Eliminado de favoritos");
  }));
  document.querySelectorAll(".add-button").forEach(button => button.addEventListener("click", () => {
    if (button.dataset.real === "true") { location.href = `producto.html?real=${encodeURIComponent(button.dataset.id)}`; return; }
    BazarCart.add(button.dataset.id); notify(`${button.dataset.product} se agregó al carrito de demostración`);
  }));
}

function featureRealProduct(product) {
  document.querySelector("#heroProductName").textContent = product.name;
  document.querySelector("#heroProductCopy").textContent = `${product.seller} · ${money.format(product.price)} · Producto aprobado`;
  document.querySelector("#heroProductLink").href = `producto.html?real=${encodeURIComponent(product.id)}`;
  document.querySelector("#communityProductLink").href = `producto.html?real=${encodeURIComponent(product.id)}`;
  document.querySelector("#communityProductLink").textContent = `Ver ${product.name} · ${money.format(product.price)} →`;
}

async function loadHome() {
  const examples = (window.BAZAR_PRODUCTS || []).map(product => ({ ...product, real: false, badge: `${product.badge} · EJEMPLO` }));
  products = examples.slice(0, 6); render();
  try {
    const { data, error } = await window.bazarSupabase.from("products").select("id,name,description,category,kind,price_cents,status,created_at,seller_profiles(store_name,status)").eq("status", "approved").order("created_at", { ascending: false });
    if (error) throw error;
    const realProducts = data.filter(product => product.seller_profiles?.status === "approved").map(product => ({ id: product.id, name: product.name, description: product.description, seller: product.seller_profiles.store_name, price: product.price_cents / 100, category: categoryKey(product.category), categoryLabel: product.category, badge: "APROBADO · PRODUCTO REAL", emoji: product.kind === "digital" ? "📚" : "◇", colors: product.kind === "digital" ? ["#efd7a8", "#b95745"] : ["#efc37c", "#b73e34"], real: true }));
    const names = new Set(realProducts.map(product => normalizedName(product.name)));
    products = [...realProducts, ...examples.filter(product => !names.has(normalizedName(product.name)))].slice(0, 6);
    if (realProducts[0]) featureRealProduct(realProducts[0]);
    render();
  } catch (error) { console.error("No fue posible cargar los productos reales en la portada.", error); notify("Mostrando ejemplos; no se pudieron cargar los productos reales"); }
}

document.querySelector(".search").addEventListener("submit", event => { event.preventDefault(); render(); document.querySelector("#productos").scrollIntoView({ behavior: "smooth" }); });
searchInput.addEventListener("input", render);
document.querySelectorAll(".category").forEach(button => button.addEventListener("click", () => { document.querySelector(".category.active")?.classList.remove("active"); button.classList.add("active"); category = button.dataset.category; render(); }));
document.querySelector(".play-button").addEventListener("click", () => notify("Este video es un ejemplo de la experiencia futura"));
document.querySelectorAll(".callout-actions button").forEach(button => button.addEventListener("click", () => notify("El registro se habilitará en la siguiente etapa")));
loadHome();
