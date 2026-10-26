const products=window.BAZAR_PRODUCTS;
const money=new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0});
const tabs=document.querySelectorAll(".account-tabs button");
const panels=document.querySelectorAll(".buyer-panel");
const toast=document.querySelector("#toast");
const getFavorites=()=>{try{return JSON.parse(localStorage.getItem("bazarViralFavorites")||"[]")}catch{return[]}};
const saveFavorites=ids=>localStorage.setItem("bazarViralFavorites",JSON.stringify(ids));

function notify(message){toast.textContent=message;toast.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove("show"),2000)}
function productCard(product,removable=false){return `<article class="buyer-product"><a href="producto.html?id=${product.id}"><div class="buyer-product-art" style="background:linear-gradient(145deg,${product.colors[0]},${product.colors[1]})"><small>${product.badge}</small><span>${product.emoji}</span></div><div class="buyer-product-copy"><small>${product.seller}</small><h3>${product.name}</h3><strong>${money.format(product.price)}</strong></div></a>${removable?`<button class="remove-favorite" data-id="${product.id}">Quitar de favoritos</button>`:""}</article>`}
function renderFavorites(){const ids=getFavorites();const favorites=ids.map(id=>products.find(product=>product.id===id)).filter(Boolean);document.querySelector("#favoriteCount").textContent=favorites.length;document.querySelector("#favoriteBadge").textContent=favorites.length;document.querySelector("#favoritesGrid").innerHTML=favorites.map(product=>productCard(product,true)).join("");document.querySelector("#favoritesGrid").hidden=!favorites.length;document.querySelector("#favoritesEmpty").hidden=!!favorites.length;document.querySelectorAll(".remove-favorite").forEach(button=>button.onclick=()=>{saveFavorites(ids.filter(id=>id!==button.dataset.id));renderFavorites();notify("Producto eliminado de favoritos")})}
function openTab(name){tabs.forEach(button=>button.classList.toggle("active",button.dataset.tab===name));panels.forEach(panel=>{const active=panel.dataset.panel===name;panel.hidden=!active;panel.classList.toggle("active",active)});window.scrollTo({top:240,behavior:"smooth"});if(name==="favorites")renderFavorites()}
tabs.forEach(button=>button.onclick=()=>openTab(button.dataset.tab));
document.querySelectorAll("[data-open-tab]").forEach(button=>button.onclick=()=>openTab(button.dataset.openTab));
document.querySelector("#recommendations").innerHTML=products.slice(0,3).map(product=>productCard(product)).join("");

let preferences=[];
try{preferences=JSON.parse(sessionStorage.getItem("bazarViralPreferences")||"[]")}catch{}
document.querySelectorAll("#preferenceGrid button").forEach(button=>{button.classList.toggle("selected",preferences.includes(button.dataset.value));button.onclick=()=>{button.classList.toggle("selected");preferences=[...document.querySelectorAll("#preferenceGrid button.selected")].map(item=>item.dataset.value)}});
document.querySelector("#savePreferences").onclick=()=>{const message=document.querySelector("#preferenceMessage");if(!preferences.length){message.textContent="Elige al menos una categoría para guardar.";return}sessionStorage.setItem("bazarViralPreferences",JSON.stringify(preferences));message.textContent=`Guardamos ${preferences.length} ${preferences.length===1?"preferencia":"preferencias"} para esta demostración.`;notify("Preferencias actualizadas")};
renderFavorites();
