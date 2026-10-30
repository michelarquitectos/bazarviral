(async()=>{
  const session=await window.adminAccessReady;
  if(!session)return;

  const status=document.querySelector("#liveDataStatus");
  const count=(table,filters=[])=>{
    let query=window.bazarSupabase.from(table).select("id",{count:"exact",head:true});
    filters.forEach(([column,value])=>{query=query.eq(column,value)});
    return query;
  };
  const money=cents=>new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format((cents||0)/100);
  const initials=value=>value.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("").toUpperCase()||"BV";
  const createdLabel=value=>new Intl.DateTimeFormat("es-MX",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));

  async function loadRealQueue(){
    const[sellersResult,productsResult]=await Promise.all([
      window.bazarSupabase.from("seller_profiles").select("id,store_name,slug,bio,category,status,created_at").eq("status","pending").order("created_at",{ascending:false}),
      window.bazarSupabase.from("products").select("id,name,description,delivery_note,category,kind,price_cents,currency,stock,status,created_at,seller_profiles(store_name,status),product_media(storage_path,alt_text,position)").eq("status","pending").order("created_at",{ascending:false})
    ]);
    if(sellersResult.error)throw sellersResult.error;
    if(productsResult.error)throw productsResult.error;

    const realItems=[
      ...sellersResult.data.map(seller=>({
        id:`real-seller-${seller.id}`,entityId:seller.id,entityType:"seller_profile",table:"seller_profiles",real:true,
        type:"persona",icon:"🏪",title:`Solicitud de tienda · ${seller.store_name}`,owner:seller.store_name,
        meta:`Vendedor · ${seller.category}`,urgency:"high",urgencyLabel:"REAL",preview:initials(seller.store_name),
        details:{"Tienda":seller.store_name,"Dirección pública":`/tienda/${seller.slug}`,"Categoría":seller.category,"Presentación":seller.bio,"Enviado":createdLabel(seller.created_at)}
      })),
      ...productsResult.data.map(product=>({
        id:`real-product-${product.id}`,entityId:product.id,entityType:"product",table:"products",real:true,sellerApproved:product.seller_profiles?.status==="approved",
        type:"producto",icon:product.kind==="digital"?"📚":"◇",title:product.name,owner:product.seller_profiles?.store_name||"Tienda",
        meta:`${product.kind==="digital"?"Producto digital":"Producto físico"} · ${product.category}`,urgency:"high",urgencyLabel:"REAL",preview:product.kind==="digital"?"📚":"◇",imageUrl:product.product_media?.[0]?.storage_path?window.bazarSupabase.storage.from("product-images").getPublicUrl(product.product_media[0].storage_path).data.publicUrl:null,imageAlt:product.product_media?.[0]?.alt_text||product.name,
        details:{"Tienda":product.seller_profiles?.store_name||"Tienda","Estado de la tienda":product.seller_profiles?.status==="approved"?"Aprobada":"Pendiente de aprobación","Precio":money(product.price_cents),"Inventario":product.stock??"Sin límite","Entrega":product.delivery_note,"Descripción":product.description,"Enviado":createdLabel(product.created_at)}
      }))
    ];
    for(let index=reviewItems.length-1;index>=0;index-=1){if(reviewItems[index].real)reviewItems.splice(index,1)}
    reviewItems.unshift(...realItems);
    document.querySelector("#metricPending").textContent=realItems.length;
    document.querySelector("#navPending").textContent=realItems.length;
    document.querySelector("#allCount").textContent=reviewItems.length;
    document.querySelector('[data-jump="pendientes"]').textContent=`REVISAR ${realItems.length} SOLICITUD${realItems.length===1?"":"ES"} REAL${realItems.length===1?"":"ES"}`;
    renderQueue();renderPriority();
  }

  async function refresh(){
    status.textContent="Consultando…";
    try{
      const[accounts,sellers,creators,products]=await Promise.all([
        count("profiles"),count("seller_profiles",[["status","pending"]]),count("creator_profiles",[["status","pending"]]),count("products",[["status","pending"]])
      ]);
      const results=[accounts,sellers,creators,products];
      const failure=results.find(result=>result.error);
      if(failure)throw failure.error;
      document.querySelector("#realAccounts").textContent=accounts.count??0;
      document.querySelector("#realSellerRequests").textContent=sellers.count??0;
      document.querySelector("#realCreatorRequests").textContent=creators.count??0;
      document.querySelector("#realProductRequests").textContent=products.count??0;
      await loadRealQueue();
      status.textContent="Actualizado desde la base real";
    }catch(error){
      console.error("No fue posible cargar la cola real.",error);
      status.textContent="No se pudieron cargar los datos";
    }
  }

  window.refreshAdminLiveData=refresh;
  await refresh();
})();
