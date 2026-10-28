const examples = window.BAZAR_PRODUCTS || [];
const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const requested = new URLSearchParams(location.search).get("seller");
let storeProducts = [];
let isRealStore = false;

const set = (selector, value) => document.querySelector(selector).textContent = value;
function escapeHTML(value) { return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }
function notify(message) { const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove("show"), 2100); }

function fillStore(profile) {
  document.title = `${profile.name} — Bazar Viral`;
  set("#storeName", profile.name); set("#storeCrumb", profile.name);
  set("#storeInitial", profile.name.split(" ").map(word => word[0]).slice(0, 2).join("").toUpperCase());
  set("#storeBio", profile.bio); set("#storeCategory", profile.category); set("#storeLocation", profile.location);
  set("#productCount", storeProducts.length); set("#storeRating", profile.rating); set("#storeReviews", profile.reviews); set("#storeStory", profile.story);
  if (profile.real) { set("#storeStatus", "TIENDA APROBADA · DATOS REALES"); set("#storeDataNote", "Información actualizada desde la base real de Bazar Viral."); document.querySelector("#storeReviewsSection").hidden = true; }
}

function productCard(product) {
  const href = product.real ? `producto.html?real=${encodeURIComponent(product.id)}` : `producto.html?id=${encodeURIComponent(product.id)}`;
  return `<article class="product-card ${product.real ? "real-product" : "demo-product"}"><a class="product-link" href="${href}"><div class="product-art" style="background:linear-gradient(145deg,${product.colors[0]},${product.colors[1]})"><span class="product-badge">${escapeHTML(product.badge)}</span><span class="emoji">${escapeHTML(product.emoji)}</span></div><div class="product-copy"><small>${escapeHTML(product.categoryLabel)} · ${product.real ? "Producto aprobado" : `★ ${product.rating}`}</small><h3>${escapeHTML(product.name)}</h3><p>${escapeHTML(product.description)}</p></a><div class="price-row"><span class="price">${money.format(product.price)}</span><button class="add-button" data-id="${escapeHTML(product.id)}" data-real="${product.real ? "true" : "false"}">${product.real ? "VER PRODUCTO" : "AGREGAR DEMO"}</button></div></div></article>`;
}

function render() {
  const visible = [...storeProducts]; const sort = document.querySelector("#storeSort").value;
  if (sort === "low") visible.sort((a, b) => a.price - b.price); if (sort === "high") visible.sort((a, b) => b.price - a.price);
  document.querySelector("#storeProducts").innerHTML = visible.map(productCard).join("");
  document.querySelectorAll(".add-button").forEach(button => button.onclick = () => {
    if (button.dataset.real === "true") { location.href = `producto.html?real=${encodeURIComponent(button.dataset.id)}`; return; }
    BazarCart.add(button.dataset.id); notify("Producto de demostración agregado al carrito");
  });
  document.querySelector("#questionProduct").innerHTML = visible.map(product => `<option>${escapeHTML(product.name)}</option>`).join("");
}

async function loadStore() {
  if (requested) {
    try {
      const { data, error } = await window.bazarSupabase.from("seller_profiles").select("id,store_name,slug,bio,category,status,products(id,name,description,delivery_note,category,kind,price_cents,stock,status)").eq("store_name", requested).eq("status", "approved").single();
      if (error || !data) throw error || new Error("Tienda no encontrada");
      storeProducts = (data.products || []).filter(product => product.status === "approved").map(product => ({ id: product.id, name: product.name, description: product.description, categoryLabel: product.category, price: product.price_cents / 100, rating: 0, badge: "APROBADO · PRODUCTO REAL", emoji: product.kind === "digital" ? "📚" : "◇", colors: product.kind === "digital" ? ["#efd7a8", "#b95745"] : ["#efc37c", "#b73e34"], real: true }));
      isRealStore = true;
      fillStore({ name: data.store_name, bio: data.bio, category: `✦ ${data.category}`, location: "📍 México", rating: "—", reviews: "0", story: data.bio, real: true });
      render(); return;
    } catch (error) { console.error("No fue posible cargar la tienda real.", error); notify("No pudimos cargar esta tienda"); }
  }
  const seller = requested && examples.some(product => product.seller === requested) ? requested : examples[0].seller;
  storeProducts = examples.filter(product => product.seller === seller).map(product => ({ ...product, real: false, badge: `${product.badge} · EJEMPLO` }));
  const profiles = { "Casa Nómada": ["Objetos cálidos y funcionales para rincones que se sienten propios.", "🏠 Hogar", "📍 Ciudad de México", "Elegimos piezas que aportan utilidad y carácter sin complicar los espacios."], "TecnoVida": ["Tecnología cotidiana explicada sin términos innecesarios.", "🎧 Tecnología", "📍 Monterrey, Nuevo León", "Probamos accesorios prácticos y mostramos sus ventajas y límites con claridad."] };
  const profile = profiles[seller] || ["Productos seleccionados con información clara y atención cercana.", `✦ ${storeProducts[0]?.categoryLabel || "Productos"}`, "📍 México", "Esta tienda reúne productos útiles, distintos y fáciles de entender antes de comprar."];
  const reviews = storeProducts.reduce((sum, product) => sum + product.reviews, 0); const rating = storeProducts.length ? (storeProducts.reduce((sum, product) => sum + product.rating, 0) / storeProducts.length).toFixed(1) : "—";
  fillStore({ name: seller, bio: profile[0], category: profile[1], location: profile[2], rating, reviews, story: profile[3], real: false }); render();
}

document.querySelector("#storeSort").onchange = render;
let followed = false; document.querySelector("#followStore").onclick = event => { followed = !followed; event.currentTarget.textContent = followed ? "SIGUIENDO" : "SEGUIR TIENDA"; notify(followed ? "Ahora sigues esta tienda" : "Dejaste de seguir esta tienda"); };
const modal = document.querySelector("#questionModal"), backdrop = document.querySelector("#questionBackdrop");
function closeModal() { modal.hidden = true; backdrop.hidden = true; document.body.style.overflow = ""; }
document.querySelector("#contactStore").onclick = () => { modal.hidden = false; backdrop.hidden = false; document.body.style.overflow = "hidden"; };
document.querySelectorAll("#closeQuestion,[data-cancel]").forEach(button => button.onclick = closeModal); backdrop.onclick = closeModal;
document.querySelector("#sendQuestion").onclick = () => { if (!document.querySelector("#questionForm").reportValidity()) return; closeModal(); notify("Pregunta preparada en esta demostración"); };
loadStore();
