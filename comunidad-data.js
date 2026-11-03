(async()=>{
  const result=await window.bazarSupabase.from("creator_content").select("id,title,description,external_url,disclosure,created_at,creator_profiles(creator_name,handle,status,topics),products(id,name,category,price_cents,status)").eq("status","approved").order("created_at",{ascending:false});
  if(result.error){console.error("No fue posible cargar contenido real.",result.error);return}
  const real=(result.data||[]).filter(item=>item.creator_profiles?.status==="approved").map(item=>({id:`real-${item.id}`,real:true,title:item.title,description:item.description,creator:item.creator_profiles.creator_name,handle:`@${item.creator_profiles.handle}`,initial:(item.creator_profiles.creator_name[0]||"C").toUpperCase(),category:(item.products?.category||item.creator_profiles.topics?.[0]||"todos").toLowerCase(),realProductId:item.products?.id||null,productId:"",emoji:"▶",product:item.products?.name||"Contenido original",price:(item.products?.price_cents||0)/100,bg:"linear-gradient(155deg,#d8a25f,#9e392f)",badge:"CONTENIDO APROBADO",likes:0,disclosure:item.disclosure,externalUrl:item.external_url}));
  if(real.length){videos.unshift(...real);render()}
})();
