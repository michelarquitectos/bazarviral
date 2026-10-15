const products=[
 {name:"Lámpara hongo ámbar",seller:"Casa Nómada",price:899,category:"hogar",emoji:"💡",badge:"Viral esta semana",colors:["#f5c771","#b94c2e"]},
 {name:"Mini proyector portátil",seller:"TecnoVida",price:1299,category:"tecnologia",emoji:"📽️",badge:"Muy compartido",colors:["#d9ddd8","#76828d"]},
 {name:"Organizador modular",seller:"Hogar Simple",price:649,category:"hogar",emoji:"🗄️",badge:"Útil de verdad",colors:["#ead5b8","#b9895f"]},
 {name:"Kit de papelería creativa",seller:"Letras Lindas",price:499,category:"papeleria",emoji:"✏️",badge:"Hecho con detalle",colors:["#f9c8cc","#d97b83"]},
 {name:"Actividades infantiles",seller:"Mundo Creativo",price:149,category:"digital",emoji:"📚",badge:"Producto digital",colors:["#c8e3c4","#73a970"]},
 {name:"Kit de movimiento en casa",seller:"Activa",price:579,category:"bienestar",emoji:"🏃",badge:"Nueva categoría",colors:["#d7d1ee","#8173b5"]}
];
const grid=document.querySelector("#productGrid"),searchInput=document.querySelector("#searchInput"),resultCount=document.querySelector("#resultCount"),emptyState=document.querySelector("#emptyState"),toast=document.querySelector("#toast");
let category="todos";
const money=new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0});
function card(product){return `<article class="product-card" data-category="${product.category}"><div class="product-art" style="background:linear-gradient(145deg,${product.colors[0]},${product.colors[1]})"><span class="product-badge">${product.badge}</span><button class="favorite" aria-label="Guardar ${product.name}">♡</button><span class="emoji" aria-hidden="true">${product.emoji}</span></div><div class="product-copy"><small>${product.seller} · Vendedor verificado</small><h3>${product.name}</h3><div class="price-row"><span class="price">${money.format(product.price)}</span><button class="add-button" data-product="${product.name}">Agregar</button></div></div></article>`}
function render(){const term=searchInput.value.trim().toLocaleLowerCase("es");const visible=products.filter(p=>(category==="todos"||p.category===category)&&p.name.toLocaleLowerCase("es").includes(term));grid.innerHTML=visible.map(card).join("");resultCount.textContent=`${visible.length} ${visible.length===1?"hallazgo":"hallazgos"}`;emptyState.hidden=visible.length!==0;bindCards()}
function notify(message){toast.textContent=message;toast.classList.add("show");window.clearTimeout(notify.timer);notify.timer=window.setTimeout(()=>toast.classList.remove("show"),2200)}
function bindCards(){document.querySelectorAll(".favorite").forEach(button=>button.addEventListener("click",()=>{button.classList.toggle("saved");button.textContent=button.classList.contains("saved")?"♥":"♡";notify(button.classList.contains("saved")?"Guardado en favoritos":"Eliminado de favoritos")}));document.querySelectorAll(".add-button").forEach(button=>button.addEventListener("click",()=>{const count=document.querySelector(".cart-button span");count.textContent=Number(count.textContent)+1;notify(`${button.dataset.product} se agregó al carrito`)}))}
document.querySelector(".search").addEventListener("submit",event=>{event.preventDefault();render();document.querySelector("#productos").scrollIntoView({behavior:"smooth"})});searchInput.addEventListener("input",render);
document.querySelectorAll(".category").forEach(button=>button.addEventListener("click",()=>{document.querySelector(".category.active")?.classList.remove("active");button.classList.add("active");category=button.dataset.category;render()}));
document.querySelector(".play-button").addEventListener("click",()=>notify("El reproductor completo se añadirá en la siguiente etapa"));
document.querySelectorAll(".callout-actions button").forEach(button=>button.addEventListener("click",()=>notify("El registro se habilitará en la siguiente etapa")));
render();
