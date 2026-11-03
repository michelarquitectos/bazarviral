(async()=>{
  const safe=value=>String(value??"").replace(/[&<>'"]/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]);
  const initialBanner=document.querySelector(".creator-status");
  initialBanner.querySelector("strong").textContent="Consultando tu perfil creativo…";
  initialBanner.querySelector("p").textContent="Estamos leyendo la información guardada en Bazar Viral.";
  const{data:{session}}=await window.bazarSupabase.auth.getSession();
  if(!session){location.href="cuenta.html?acceso=creador";return}
  const profileResult=await window.bazarSupabase.from("creator_profiles").select("*").eq("account_id",session.user.id).maybeSingle();
  if(profileResult.error){console.error(profileResult.error);initialBanner.querySelector("strong").textContent="No pudimos cargar tu perfil";initialBanner.querySelector("p").textContent="Recarga la página para intentarlo nuevamente.";return}
  const profile=profileResult.data;
  if(!profile){
    const identity=document.querySelector(".creator-identity");
    identity.querySelector("span").textContent="BV";identity.querySelector("strong").textContent="Tu perfil";identity.querySelector("p").textContent="Aún no solicitado";
    document.querySelector(".dashboard-welcome h1").textContent="Tu espacio creativo.";
    const banner=document.querySelector(".creator-status");
    banner.querySelector("strong").textContent="Aún no has enviado tu perfil creativo";
    banner.querySelector("p").textContent="Completa la solicitud para vincular tu primer contenido y enviarlo a revisión.";
    banner.querySelector("button").textContent="CREAR PERFIL";banner.querySelector("button").onclick=()=>location.href="creador.html";
    document.querySelectorAll(".seller-metrics article strong").forEach((node,index)=>node.textContent=index===3?"$0":"0");
    document.querySelector("#newContent").textContent="＋ CREAR PERFIL";document.querySelector("#newContent").onclick=()=>location.href="creador.html";
    return;
  }
  const contentResult=await window.bazarSupabase.from("creator_content").select("id,title,description,external_url,disclosure,status,created_at,products(name)").eq("creator_id",profile.id).order("created_at",{ascending:false});
  if(contentResult.error){console.error(contentResult.error);return}
  const content=contentResult.data||[];
  const initial=(profile.creator_name.trim()[0]||"C").toUpperCase();
  document.querySelectorAll(".creator-identity span,.creator-profile-cover span").forEach(node=>node.textContent=initial);
  const identity=document.querySelector(".creator-identity div");
  identity.querySelector("strong").textContent=profile.creator_name;
  identity.querySelector("p").textContent=`@${profile.handle} · ${profile.status==="approved"?"Aprobado":"En revisión"}`;
  document.querySelector(".dashboard-welcome h1").textContent=`Hola, ${profile.creator_name}.`;
  const banner=document.querySelector(".creator-status");
  banner.querySelector("strong").textContent=profile.status==="approved"?"Tu perfil creativo está aprobado":"Tu perfil creativo está en revisión";
  banner.querySelector("p").textContent=profile.status==="approved"?"Ya puedes preparar contenido; cada publicación se revisa antes de aparecer en la comunidad.":"Puedes preparar contenido mientras revisamos tu perfil. Nada genera ingresos todavía.";
  const metrics=document.querySelectorAll(".seller-metrics article");
  metrics[0].querySelector("strong").textContent=content.length;
  metrics[0].querySelector("p").textContent=`${content.filter(item=>item.status==="approved").length} aprobado(s) · ${content.filter(item=>item.status==="pending").length} en revisión`;
  const preview=document.querySelector(".creator-profile-preview");
  preview.querySelector("h3").textContent=profile.creator_name;preview.querySelector("b").textContent=`@${profile.handle}`;preview.querySelector("p").textContent=profile.bio;
  preview.querySelector("small").textContent=profile.status==="approved"?"CREADOR APROBADO":"CREADOR EN REVISIÓN";
  const list=document.querySelector(".creator-content-list");
  list.innerHTML=content.length?content.map(item=>`<article><div class="content-thumb">▶</div><div><small>${safe(item.products?.name||"CONTENIDO ORIGINAL")}</small><h3>${safe(item.title)}</h3><p>${safe(item.disclosure)}</p></div><span class="product-state ${item.status==="approved"?"ready":"draft"}">${item.status==="approved"?"APROBADO":item.status==="pending"?"EN REVISIÓN":"BORRADOR"}</span><a href="${safe(item.external_url)}" target="_blank" rel="noopener">VER</a></article>`).join(""):`<p>Todavía no has vinculado contenido.</p>`;
  document.querySelectorAll("[data-new-content],[data-open-content]").forEach(button=>button.onclick=()=>location.href="creador.html?nuevo=1");
})();
