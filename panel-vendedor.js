let sellerProducts=[];
let productFilter="all";
const toast=document.querySelector("#toast");
const drawer=document.querySelector("#sellerDrawer");
const backdrop=document.querySelector("#sellerBackdrop");

function notify(message){toast.textContent=message;toast.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove("show"),2400)}
function escapeHTML(value){return String(value??"").replace(/[&<>'"]/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[character]))}
function initials(value){return value.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("").toUpperCase()||"BV"}
function money(cents){return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format((cents||0)/100)}
function loadScript(src){return new Promise((resolve,reject)=>{const script=document.createElement("script");script.src=src;script.onload=resolve;script.onerror=reject;document.head.append(script)})}

function openTab(name){
  document.querySelectorAll("[data-tab]").forEach(button=>button.classList.toggle("active",button.dataset.tab===name));
  document.querySelectorAll("[data-panel]").forEach(panel=>{const active=panel.dataset.panel===name;panel.hidden=!active;panel.classList.toggle("active",active)});
  document.querySelector("#sellerMobileMenu").hidden=true;
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderProducts(){
  const term=document.querySelector("#sellerProductSearch").value.toLocaleLowerCase("es");
  const visible=sellerProducts.filter(product=>(productFilter==="all"||product.filterState===productFilter)&&(product.name+product.category).toLocaleLowerCase("es").includes(term));
  document.querySelector("#sellerProductList").innerHTML=visible.map(product=>`<article class="seller-product"><div class="seller-product-art" style="background:linear-gradient(135deg,${product.colors[0]},${product.colors[1]})">${escapeHTML(product.emoji)}</div><div><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.category)} · ${escapeHTML(product.delivery)}</small></div><span class="seller-product-price">${escapeHTML(product.price)}</span><span class="product-state ${escapeHTML(product.filterState)}">${escapeHTML(product.stateLabel)}</span><button data-edit="${escapeHTML(product.id)}">VER</button></article>`).join("");
  document.querySelector("#sellerProductEmpty").hidden=visible.length>0;
  document.querySelector("#sellerProductList").hidden=!visible.length;
  document.querySelectorAll("[data-edit]").forEach(button=>button.onclick=()=>openProductDrawer(button.dataset.edit));
}

function openDrawer(content){document.querySelector("#drawerContent").innerHTML=content;drawer.hidden=false;backdrop.hidden=false;document.body.style.overflow="hidden"}
function closeDrawer(){drawer.hidden=true;backdrop.hidden=true;document.body.style.overflow=""}
function openProductDrawer(id){
  const product=sellerProducts.find(item=>item.id===id);
  if(!product){notify("La creación de nuevos productos será el siguiente bloque");return}
  openDrawer(`<div class="drawer-content"><p class="eyebrow">PRODUCTO REAL</p><h2>${escapeHTML(product.name)}</h2><p>${escapeHTML(product.description)}</p><div class="task-list"><article class="done"><span>✓</span><div><strong>${escapeHTML(product.stateLabel)}</strong><small>Estado guardado en la base real</small></div></article><article><span>$</span><div><strong>${escapeHTML(product.price)}</strong><small>Precio actual</small></div></article><article><span>□</span><div><strong>${escapeHTML(String(product.stock))} disponibles</strong><small>${escapeHTML(product.delivery)}</small></div></article></div></div>`)
}

function bindInteractions(){
  document.querySelector(".account-link").href="cuenta.html?v=5";
  document.querySelectorAll("[data-tab],[data-open-tab]").forEach(button=>button.onclick=()=>openTab(button.dataset.tab||button.dataset.openTab));
  document.querySelector("#sellerProductSearch").oninput=renderProducts;
  document.querySelectorAll("[data-product-filter]").forEach(button=>button.onclick=()=>{productFilter=button.dataset.productFilter;document.querySelectorAll("[data-product-filter]").forEach(item=>item.classList.toggle("active",item===button));renderProducts()});
  document.querySelector("#clearSellerSearch").onclick=()=>{document.querySelector("#sellerProductSearch").value="";productFilter="all";document.querySelectorAll("[data-product-filter]").forEach(item=>item.classList.toggle("active",item.dataset.productFilter==="all"));renderProducts()};
  document.querySelectorAll("#newProduct,[data-new-product],[data-edit-product]").forEach(button=>button.onclick=()=>notify("El formulario para nuevos productos será el siguiente bloque"));
  document.querySelector("#sellerHelp").onclick=()=>notify("Tu tienda está aprobada y las ventas continúan desactivadas");
  document.querySelector("#openOrder").onclick=()=>notify("Todavía no existen pedidos reales");
  document.querySelector("#editStore").onclick=()=>notify("La edición del perfil se habilitará en el siguiente bloque");
  document.querySelector("#closeSellerDrawer").onclick=closeDrawer;
  backdrop.onclick=closeDrawer;
  document.querySelector("#sellerMenu").onclick=()=>document.querySelector("#sellerMobileMenu").hidden=!document.querySelector("#sellerMobileMenu").hidden;
  document.addEventListener("keydown",event=>{if(event.key==="Escape")closeDrawer()});
}

function applyRealData(profile,seller,products){
  const storeInitials=initials(seller.store_name);
  const identity=document.querySelector(".store-identity");
  identity.querySelector(":scope > span").textContent=storeInitials;
  identity.querySelector("strong").textContent=seller.store_name;
  identity.querySelector("p").textContent=seller.status==="approved"?"Tienda aprobada":"Tienda en revisión";
  document.querySelector(".demo-pill").textContent="DATOS REALES · VENTAS OFF";
  document.querySelector(".dashboard-welcome h1").textContent=`Buenos días, ${profile.display_name}.`;

  const banner=document.querySelector(".status-banner");
  banner.querySelector("span").textContent=seller.status==="approved"?"✓":"◷";
  banner.querySelector("strong").textContent=seller.status==="approved"?"Tu tienda está aprobada":"Tu tienda está en revisión";
  banner.querySelector("p").textContent="Tu información es real. Los cobros y las ventas siguen desactivados hasta completar la operación del marketplace.";

  const metrics=document.querySelectorAll(".seller-metrics article");
  metrics[0].querySelector("strong").textContent="$0";
  metrics[0].querySelector("p").textContent="Ventas aún desactivadas";
  metrics[1].querySelector("strong").textContent="0";
  metrics[1].querySelector("p").textContent="Sin pedidos reales";
  metrics[2].querySelector("strong").textContent=products.length;
  metrics[2].querySelector("p").textContent=`${products.filter(product=>product.status==="approved").length} aprobado${products.filter(product=>product.status==="approved").length===1?"":"s"}`;
  metrics[3].querySelector("strong").textContent="$0";
  metrics[3].querySelector("p").textContent="Pagos no conectados";

  sellerProducts=products.map(product=>({
    id:product.id,name:product.name,category:product.category,price:money(product.price_cents),stock:product.stock??"Sin límite",
    delivery:product.delivery_note,description:product.description,filterState:product.status==="approved"?"ready":"draft",
    stateLabel:product.status==="approved"?"APROBADO":product.status==="pending"?"EN REVISIÓN":"BORRADOR",
    emoji:product.kind==="digital"?"📚":"◇",colors:product.kind==="digital"?["#ecd4a4","#b35443"]:["#efc583","#b64035"]
  }));
  document.querySelector('.seller-dashboard-nav [data-tab="products"] b').textContent=products.length;
  document.querySelector('.seller-dashboard-nav [data-tab="orders"] b').textContent="0";

  const tasks=document.querySelector(".task-list");
  tasks.innerHTML=`<article class="done"><span>✓</span><div><strong>Perfil de tienda aprobado</strong><small>${escapeHTML(seller.store_name)} está listo</small></div></article><article class="done"><span>✓</span><div><strong>${products.length?"Primer producto aprobado":"Prepara tu primer producto"}</strong><small>${products.length?escapeHTML(products[0].name):"Aún no hay productos"}</small></div></article><article><span>3</span><div><strong>Ventas todavía desactivadas</strong><small>Faltan pagos, envíos y políticas operativas</small></div></article>`;
  const activityCard=document.querySelector(".activity-card");
  activityCard.innerHTML=`<div class="card-heading"><div><p class="eyebrow">ACTIVIDAD REAL</p><h2>Lo más reciente.</h2></div></div><div class="activity"><span>HOY</span><p><b>Tienda aprobada</b> ${escapeHTML(seller.store_name)}</p></div>${products[0]?`<div class="activity"><span>HOY</span><p><b>Producto aprobado</b> ${escapeHTML(products[0].name)}</p></div>`:""}<small>Información actualizada desde la base real.</small>`;

  const preview=document.querySelector(".public-store-preview");
  preview.querySelector(".store-cover span").textContent=storeInitials;
  preview.querySelector("small").textContent=seller.status==="approved"?"TIENDA APROBADA":"TIENDA EN REVISIÓN";
  preview.querySelector("h3").textContent=seller.store_name;
  preview.querySelector("p").textContent=seller.bio;
  const tags=preview.querySelectorAll(":scope > div:nth-child(2) > div span");
  tags[0].textContent=seller.category;
  tags[1].textContent=profile.city||"Ubicación no indicada";
  renderProducts();
}

async function loadRealSellerDashboard(){
  await loadScript("assets/vendor/supabase.js");
  await loadScript("supabase-client.js");
  const{data:{session}}=await window.bazarSupabase.auth.getSession();
  if(!session){location.replace("cuenta.html?acceso=vendedor");return}
  const[profileResult,sellerResult]=await Promise.all([
    window.bazarSupabase.from("profiles").select("display_name,city").eq("id",session.user.id).single(),
    window.bazarSupabase.from("seller_profiles").select("id,store_name,slug,bio,category,status").eq("account_id",session.user.id).maybeSingle()
  ]);
  if(profileResult.error)throw profileResult.error;
  if(sellerResult.error)throw sellerResult.error;
  if(!sellerResult.data){location.replace("vendedor.html?v=2");return}
  const productsResult=await window.bazarSupabase.from("products").select("id,name,description,delivery_note,category,kind,price_cents,stock,status").eq("seller_id",sellerResult.data.id).order("created_at",{ascending:false});
  if(productsResult.error)throw productsResult.error;
  applyRealData(profileResult.data,sellerResult.data,productsResult.data);
}

bindInteractions();
loadRealSellerDashboard().catch(error=>{console.error("No fue posible cargar el panel real del vendedor.",error);notify("No se pudieron cargar los datos reales")});
