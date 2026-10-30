let products=[];
const money=new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0});
const grid=document.querySelector("#catalogGrid");
const search=document.querySelector("#catalogSearch");
const count=document.querySelector("#catalogCount");
const empty=document.querySelector("#catalogEmpty");
const range=document.querySelector("#priceRange");
const output=document.querySelector("#priceOutput");
const sort=document.querySelector("#sortProducts");
const toast=document.querySelector("#toast");

function escapeHTML(value){return String(value??"").replace(/[&<>'"]/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[character]))}
function categoryKey(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").replace(/\s+/g,"-")}
function normalizedName(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim()}
function notify(text){toast.textContent=text;toast.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove("show"),2400)}

function card(product){
  const detail=product.real?"Producto aprobado":"Ejemplo de catálogo";
  const href=product.real?`producto.html?real=${encodeURIComponent(product.id)}`:`producto.html?id=${encodeURIComponent(product.id)}`;
  const image=product.imageUrl?`<img src="${escapeHTML(product.imageUrl)}" alt="${escapeHTML(product.imageAlt||product.name)}">`:"";
  return `<article class="product-card ${product.real?"real-product":"demo-product"}"><a class="product-link" href="${href}"><div class="product-art" style="background:linear-gradient(145deg,${product.colors[0]},${product.colors[1]})">${image}<span class="product-badge">${escapeHTML(product.badge)}</span><span class="emoji">${escapeHTML(product.emoji)}</span></div><div class="product-copy"><small>${escapeHTML(product.seller)} · ${detail}</small><span class="product-type">${escapeHTML(product.type)}</span><h3>${escapeHTML(product.name)}</h3><p>${escapeHTML(product.description)}</p></a><div class="price-row"><span class="price">${money.format(product.price)}</span><button class="add-button" data-id="${escapeHTML(product.id)}" data-name="${escapeHTML(product.name)}" data-real="${product.real?"true":"false"}">${product.real?"VER DATOS":"AGREGAR DEMO"}</button></div></div></article>`;
}

function render(){
  const term=search.value.trim().toLocaleLowerCase("es");
  const category=document.querySelector('input[name="category"]:checked').value;
  const types=[...document.querySelectorAll('input[name="type"]:checked')].map(input=>input.value);
  const max=Number(range.value);
  const visible=products.filter(product=>(category==="todos"||product.category===category)&&(!types.length||types.includes(product.type))&&product.price<=max&&(product.name+" "+product.seller+" "+product.categoryLabel).toLocaleLowerCase("es").includes(term));
  if(sort.value==="low")visible.sort((a,b)=>a.price-b.price);
  if(sort.value==="high")visible.sort((a,b)=>b.price-a.price);
  if(sort.value==="rating")visible.sort((a,b)=>(b.rating||0)-(a.rating||0));
  if(sort.value==="recent")visible.reverse();
  grid.innerHTML=visible.map(card).join("");
  count.textContent=`${visible.length} ${visible.length===1?"producto":"productos"}`;
  empty.hidden=!!visible.length;
  document.querySelectorAll(".add-button").forEach(button=>button.onclick=()=>{
    if(button.dataset.real==="true"){location.href=`producto.html?real=${encodeURIComponent(button.dataset.id)}`;return}
    BazarCart.add(button.dataset.id);notify(`${button.dataset.name} se agregó al carrito de demostración`);
  });
}

async function loadCatalog(){
  const examples=(window.BAZAR_PRODUCTS||[]).map(product=>({...product,real:false,badge:`${product.badge} · EJEMPLO`}));
  products=examples;
  render();
  try{
    const{data,error}=await window.bazarSupabase.from("products").select("id,name,slug,description,delivery_note,category,kind,price_cents,stock,status,created_at,seller_profiles(store_name,status),product_media(storage_path,alt_text,position)").eq("status","approved").order("created_at",{ascending:false});
    if(error)throw error;
    const realProducts=data.filter(product=>product.seller_profiles?.status==="approved").map(product=>{const media=product.product_media?.sort((a,b)=>a.position-b.position)?.[0];return({
      id:product.id,name:product.name,description:product.description,seller:product.seller_profiles.store_name,
      price:product.price_cents/100,type:product.kind==="digital"?"Digital":"Físico",category:categoryKey(product.category),categoryLabel:product.category,
      rating:0,badge:"APROBADO · PRODUCTO REAL",emoji:product.kind==="digital"?"📚":"◇",colors:product.kind==="digital"?["#efd7a8","#b95745"]:["#efc37c","#b73e34"],
      real:true,delivery:product.delivery_note,stock:product.stock,imageUrl:media?window.bazarSupabase.storage.from("product-images").getPublicUrl(media.storage_path).data.publicUrl:"",imageAlt:media?.alt_text
    })});
    const realNames=new Set(realProducts.map(product=>normalizedName(product.name)));
    products=[...realProducts,...examples.filter(product=>!realNames.has(normalizedName(product.name)))];
    render();
  }catch(error){
    console.error("No fue posible cargar los productos reales.",error);
    notify("Mostrando ejemplos; no se pudieron cargar los productos reales");
  }
}

document.querySelector(".catalog-search").onsubmit=event=>{event.preventDefault();render()};
document.querySelectorAll(".filters input").forEach(input=>input.oninput=()=>{output.value=money.format(Number(range.value));render()});
sort.onchange=render;
document.querySelector("#clearFilters").onclick=()=>{search.value="";document.querySelector('input[value="todos"]').checked=true;document.querySelectorAll('input[name="type"]').forEach(input=>input.checked=false);range.value=1500;output.value=money.format(1500);sort.value="featured";render()};
loadCatalog();
