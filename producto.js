const realStyles = document.createElement("link");
realStyles.rel = "stylesheet";
realStyles.href = "producto-real.css?v=1";
document.head.append(realStyles);
const examples = window.BAZAR_PRODUCTS || [];
const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const params = new URLSearchParams(location.search);
const realId = params.get("real");
const toast = document.querySelector("#toast");

function set(selector, text) { document.querySelector(selector).textContent = text; }
function notify(text) { toast.textContent = text; toast.classList.add("show"); clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove("show"), 2400); }
function colorsFor(kind) { return kind === "digital" ? ["#efd7a8", "#b95745"] : ["#efc37c", "#b73e34"]; }
function emojiFor(kind) { return kind === "digital" ? "📚" : "◇"; }

function renderRelated(currentName) {
  document.querySelector("#relatedGrid").innerHTML = examples.filter(item => item.name !== currentName).slice(0, 3).map(item => `<article class="product-card"><a class="product-link" href="producto.html?id=${encodeURIComponent(item.id)}"><div class="product-art" style="background:linear-gradient(145deg,${item.colors[0]},${item.colors[1]})"><span class="emoji">${item.emoji}</span></div><div class="product-copy"><small>${item.seller} · Ejemplo</small><h3>${item.name}</h3><span class="price">${money.format(item.price)}</span></div></a></article>`).join("");
}

function commonRender(product) {
  document.title = `${product.name} — Bazar Viral`;
  set("#crumb", product.name); set("#seller", product.seller); set("#sellerInitial", product.seller.charAt(0).toUpperCase());
  set("#categoryLabel", product.categoryLabel.toUpperCase()); set("#productName", product.name); set("#productPrice", money.format(product.price)); set("#description", product.description); set("#artEmoji", product.emoji);if(product.imageUrl){const image=document.createElement("img");image.src=product.imageUrl;image.alt=product.imageAlt||product.name;document.querySelector("#mainArt").prepend(image)}
  document.querySelector("#mainArt").style.background = `linear-gradient(145deg,${product.colors[0]},${product.colors[1]})`;
  document.querySelector("#details").innerHTML = product.details.map(detail => `<li>${detail}</li>`).join("");
  document.querySelector("#thumbs").innerHTML = product.colors.concat(product.colors.slice(0, 2)).map((color, index) => `<button class="thumb ${index === 0 ? "active" : ""}" style="background:${color}">${product.emoji}</button>`).join("");
  document.querySelectorAll(".thumb").forEach((button, index) => button.onclick = () => { document.querySelector(".thumb.active")?.classList.remove("active"); button.classList.add("active"); set("#galleryCount", `${index + 1} / 4`); });
  renderRelated(product.name);
}

function renderExample(product) {
  commonRender({ ...product, details: product.details || [] });
  set("#rating", `★ ${product.rating}`); set("#reviews", `${product.reviews} opiniones`);
  document.querySelector("#variants").innerHTML = product.variants.map((variant, index) => `<button class="variant ${index === 0 ? "active" : ""}">${variant}</button>`).join("");
  document.querySelectorAll(".variant").forEach(button => button.onclick = () => { document.querySelector(".variant.active")?.classList.remove("active"); button.classList.add("active"); });
  if (product.type === "Digital") { set("#deliveryTitle", "Producto digital"); set("#deliveryText", "La descarga estará disponible después de confirmar el pago. No se enviará ningún artículo físico."); }
  else { set("#deliveryTitle", "Envío estándar"); set("#deliveryText", "El costo y la fecha estimada se calcularán antes de pagar."); }
  document.querySelector("#sellerLink").href = `tienda.html?seller=${encodeURIComponent(product.seller)}`;
  document.querySelector("#addCart").onclick = () => { BazarCart.add(product.id, Number(document.querySelector("#quantity").value)); notify("Producto de demostración agregado al carrito"); };
  document.querySelector("#buyNow").onclick = () => { BazarCart.add(product.id, Number(document.querySelector("#quantity").value)); location.href = "carrito.html"; };
}

function renderReal(record) {
  const kind = record.kind === "digital" ? "Digital" : "Físico";
  const stock = record.stock == null ? "Disponibilidad por confirmar" : `${record.stock} ${record.stock === 1 ? "unidad disponible" : "unidades disponibles"}`;
  const media=record.product_media?.sort((a,b)=>a.position-b.position)?.[0];const product = { name: record.name, seller: record.seller_profiles.store_name, categoryLabel: record.category, description: record.description, price: record.price_cents / 100, emoji: emojiFor(record.kind), colors: colorsFor(record.kind),imageUrl:media?.storage_path?window.bazarSupabase.storage.from("product-images").getPublicUrl(media.storage_path).data.publicUrl:null,imageAlt:media?.alt_text, details: [`Tipo: ${kind}`, `Entrega: ${record.delivery_note}`, stock, "Publicado por una tienda aprobada en Bazar Viral"] };
  commonRender(product);
  document.querySelector("#realStatus").hidden = false;
  set("#sellerStatus", "Tienda aprobada");
  document.querySelector("#sellerLink").href = `tienda.html?seller=${encodeURIComponent(product.seller)}`;
  document.querySelector("#ratingRow").innerHTML = '<strong class="real-rating">Producto aprobado</strong><span>Sin opiniones todavía</span>';
  document.querySelector("#variantSection").hidden = true;
  document.querySelector(".product-community").hidden = true;
  document.querySelector("#availabilityCard").hidden = false;
  set("#availabilityTitle", stock); set("#availabilityText", "Información actualizada desde la base real de Bazar Viral.");
  set("#deliveryTitle", kind === "Digital" ? "Descarga y acceso" : "Entrega declarada por el vendedor"); set("#deliveryText", record.delivery_note);
  document.querySelector("#quantity").max = Math.max(1, Math.min(9, record.stock || 1));
  document.querySelector("#addCart").textContent = "Ventas desactivadas"; document.querySelector("#buyNow").textContent = "Compra próximamente";
  document.querySelector("#addCart").disabled = true; document.querySelector("#buyNow").disabled = true; document.querySelector("#quantity").disabled = true;
  set("#purchaseNote", "Este producto es real y está aprobado. Los cobros y pedidos permanecerán desactivados hasta completar la operación del marketplace.");
}

async function load() {
  if (!realId) { renderExample(examples.find(item => item.id === params.get("id")) || examples[0]); return; }
  try {
    const { data, error } = await window.bazarSupabase.from("products").select("id,name,description,delivery_note,category,kind,price_cents,stock,status,seller_profiles(store_name,slug,status),product_media(storage_path,alt_text,position)").eq("id", realId).eq("status", "approved").single();
    if (error || !data || data.seller_profiles?.status !== "approved") throw error || new Error("Producto no disponible");
    renderReal(data);
  } catch (error) {
    console.error("No fue posible cargar la ficha real.", error); notify("No pudimos cargar este producto"); setTimeout(() => location.href = "catalogo.html?v=3", 1800);
  }
}

document.querySelector(".gallery-favorite").onclick = event => { event.currentTarget.textContent = event.currentTarget.textContent === "♡" ? "♥" : "♡"; };
load();
