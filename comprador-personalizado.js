let products=(window.BAZAR_PRODUCTS||[]).map(product=>({...product,real:false}));
const money=new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0});
const tabs=document.querySelectorAll(".account-tabs button");
const panels=document.querySelectorAll(".buyer-panel");
const toast=document.querySelector("#toast");
let viewerId="visitante";
let preferences=[];
let signals={views:{},dismissed:[],discoveryOffset:0};

function escapeHTML(value){return String(value??"").replace(/[&<>'"]/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[character]))}
function categoryKey(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").replace(/\s+/g,"-")}
function getJSON(storage,key,fallback){try{return JSON.parse(storage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
function setJSON(storage,key,value){storage.setItem(key,JSON.stringify(value))}
function getFavorites(){return getJSON(localStorage,"bazarViralFavorites",[])}
function signalKey(){return `bazarViralSignals:${viewerId}`}
function preferenceKey(){return `bazarViralPreferences:${viewerId}`}
function notify(message){toast.textContent=message;toast.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove("show"),2200)}
function mediaUrl(media){return media?.storage_path?window.bazarSupabase.storage.from("product-images").getPublicUrl(media.storage_path).data.publicUrl:""}

function reasonFor(product){
  if(preferences.includes(product.category))return `Porque elegiste ${product.categoryLabel||product.category}`;
  if(getFavorites().includes(product.id))return "Porque lo guardaste en favoritos";
  if(signals.views[product.id])return "Porque ya exploraste este producto";
  if(product.real)return "Producto nuevo de una tienda aprobada";
  return product.badge||"Descubrimiento para ti";
}

function productCard(product,options={}){
  const href=product.real?`producto.html?real=${encodeURIComponent(product.id)}`:`producto.html?id=${encodeURIComponent(product.id)}`;
  const image=product.imageUrl?`<img src="${escapeHTML(product.imageUrl)}" alt="${escapeHTML(product.imageAlt||product.name)}">`:`<span>${escapeHTML(product.emoji)}</span>`;
  return `<article class="buyer-product personalized-card" data-product-id="${escapeHTML(product.id)}"><a class="tracked-product" data-id="${escapeHTML(product.id)}" href="${href}"><div class="buyer-product-art" style="background:linear-gradient(145deg,${product.colors[0]},${product.colors[1]})">${image}<small>${escapeHTML(options.reason||reasonFor(product))}</small></div><div class="buyer-product-copy"><small>${escapeHTML(product.seller)} · ${product.real?"Producto aprobado":"Ejemplo"}</small><h3>${escapeHTML(product.name)}</h3><p>${escapeHTML(product.description||"")}</p><strong>${money.format(product.price)}</strong></div></a>${options.removable?`<button class="remove-favorite" data-id="${escapeHTML(product.id)}">Quitar de favoritos</button>`:`<button class="dismiss-product" data-id="${escapeHTML(product.id)}">No me interesa</button>`}</article>`;
}

function score(product,index){
  let value=Math.max(0,12-index);
  if(preferences.includes(product.category))value+=40;
  if(product.real)value+=15;
  if(getFavorites().includes(product.id))value+=25;
  value+=Math.min(18,(signals.views[product.id]||0)*6);
  value+=Math.round((product.rating||0)*2);
  return value;
}

function activeProducts(){return products.filter(product=>!signals.dismissed.includes(product.id))}
function renderPersonalized(){
  const ranked=activeProducts().map((product,index)=>({product,value:score(product,index)})).sort((a,b)=>b.value-a.value).map(item=>item.product);
  document.querySelector("#recommendations").innerHTML=ranked.slice(0,6).map(product=>productCard(product)).join("");
  const trending=[...activeProducts()].sort((a,b)=>(b.reviews||0)-(a.reviews||0)||(b.rating||0)-(a.rating||0)).slice(0,3);
  document.querySelector("#trendingProducts").innerHTML=trending.map(product=>productCard(product,{reason:"Tendencia de la comunidad"})).join("");
  const outside=activeProducts().filter(product=>!preferences.includes(product.category));
  const discoverySource=outside.length?outside:activeProducts();
  const start=discoverySource.length?signals.discoveryOffset%discoverySource.length:0;
  const discoveries=[...discoverySource.slice(start),...discoverySource.slice(0,start)].slice(0,3);
  document.querySelector("#discoveryProducts").innerHTML=discoveries.map(product=>productCard(product,{reason:"Fuera de tus categorías habituales"})).join("");
  const labels=preferences.map(value=>document.querySelector(`#preferenceGrid [data-value="${value}"] strong`)?.textContent||value);
  document.querySelector("#feedExplanation").textContent=labels.length?`Priorizamos ${labels.join(", ")}, sin ocultarte novedades y tendencias.`:"Elige intereses para afinar esta selección; mientras tanto verás una mezcla equilibrada.";
  bindProductActions();updateSummary();
}

function bindProductActions(){
  document.querySelectorAll(".tracked-product").forEach(link=>link.onclick=()=>{signals.views[link.dataset.id]=(signals.views[link.dataset.id]||0)+1;setJSON(localStorage,signalKey(),signals)});
  document.querySelectorAll(".dismiss-product").forEach(button=>button.onclick=()=>{signals.dismissed=[...new Set([...signals.dismissed,button.dataset.id])];setJSON(localStorage,signalKey(),signals);renderPersonalized();notify("Entendido: veremos menos contenido como este")});
}

function updateSummary(){
  document.querySelector("#favoriteCount").textContent=getFavorites().length;
  document.querySelector("#favoriteBadge").textContent=getFavorites().length;
  document.querySelector("#interestCount").textContent=preferences.length;
  document.querySelector("#viewCount").textContent=Object.values(signals.views).reduce((sum,value)=>sum+value,0);
}

function renderFavorites(){
  const ids=getFavorites();const favorites=ids.map(id=>products.find(product=>product.id===id)).filter(Boolean);
  document.querySelector("#favoritesGrid").innerHTML=favorites.map(product=>productCard(product,{removable:true})).join("");
  document.querySelector("#favoritesGrid").hidden=!favorites.length;document.querySelector("#favoritesEmpty").hidden=!!favorites.length;
  document.querySelectorAll(".remove-favorite").forEach(button=>button.onclick=()=>{setJSON(localStorage,"bazarViralFavorites",ids.filter(id=>id!==button.dataset.id));renderFavorites();renderPersonalized();notify("Producto eliminado de favoritos")});updateSummary();
}

function openTab(name){tabs.forEach(button=>button.classList.toggle("active",button.dataset.tab===name));panels.forEach(panel=>{const active=panel.dataset.panel===name;panel.hidden=!active;panel.classList.toggle("active",active)});window.scrollTo({top:240,behavior:"smooth"});if(name==="favorites")renderFavorites()}

function setupPreferences(){
  document.querySelectorAll("#preferenceGrid button").forEach(button=>{button.classList.toggle("selected",preferences.includes(button.dataset.value));button.onclick=()=>{button.classList.toggle("selected");preferences=[...document.querySelectorAll("#preferenceGrid button.selected")].map(item=>item.dataset.value)}});
  document.querySelector("#savePreferences").onclick=()=>{const message=document.querySelector("#preferenceMessage");if(!preferences.length){message.textContent="Elige al menos una categoría para guardar.";return}setJSON(localStorage,preferenceKey(),preferences);message.textContent=`Guardamos ${preferences.length} ${preferences.length===1?"preferencia":"preferencias"} para personalizar tu inicio.`;renderPersonalized();notify("Tu inicio se reorganizó con tus intereses")};
}

async function loadRealProducts(){
  try{
    const{data,error}=await window.bazarSupabase.from("products").select("id,name,description,category,kind,price_cents,status,created_at,seller_profiles(store_name,status),product_media(storage_path,alt_text,position)").eq("status","approved").order("created_at",{ascending:false});
    if(error)throw error;
    const real=(data||[]).filter(product=>product.seller_profiles?.status==="approved").map(product=>{const media=product.product_media?.sort((a,b)=>a.position-b.position)?.[0];return{id:product.id,name:product.name,description:product.description,seller:product.seller_profiles.store_name,price:product.price_cents/100,category:categoryKey(product.category),categoryLabel:product.category,emoji:product.kind==="digital"?"📚":"◇",badge:"Producto real",colors:product.kind==="digital"?["#efd7a8","#b95745"]:["#efc37c","#b73e34"],rating:5,reviews:0,real:true,imageUrl:mediaUrl(media),imageAlt:media?.alt_text}});
    const realNames=new Set(real.map(product=>product.name.toLocaleLowerCase("es")));products=[...real,...products.filter(product=>!realNames.has(product.name.toLocaleLowerCase("es")))];
  }catch(error){console.error("No fue posible cargar los productos reales para el inicio personalizado.",error)}
}

async function initialize(){
  const{data}=await window.bazarSupabase.auth.getSession();const user=data.session?.user;
  viewerId=user?.id||"visitante";
  const legacy=getJSON(sessionStorage,"bazarViralPreferences",[]);
  preferences=getJSON(localStorage,preferenceKey(),legacy);
  signals=getJSON(localStorage,signalKey(),signals);
  const name=user?.user_metadata?.display_name?.trim().split(/\s+/)[0];if(name)document.querySelector("#buyerGreeting").textContent=`Hola, ${name}.`;
  setupPreferences();await loadRealProducts();renderPersonalized();renderFavorites();
}

tabs.forEach(button=>button.onclick=()=>openTab(button.dataset.tab));
document.querySelectorAll("[data-open-tab]").forEach(button=>button.onclick=()=>openTab(button.dataset.openTab));
document.querySelector("#refreshDiscovery").onclick=()=>{signals.discoveryOffset+=3;setJSON(localStorage,signalKey(),signals);renderPersonalized();document.querySelector("#discoveryProducts").scrollIntoView({behavior:"smooth",block:"center"});notify("Te mostramos un descubrimiento diferente")};
initialize();
