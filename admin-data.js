(async()=>{
  const session=await window.adminAccessReady;
  if(!session)return;

  const status=document.querySelector("#liveDataStatus");
  const count=(table,filters=[])=>{
    let query=window.bazarSupabase.from(table).select("id",{count:"exact",head:true});
    filters.forEach(([column,value])=>{query=query.eq(column,value)});
    return query;
  };

  try{
    const[accounts,sellers,creators,products]=await Promise.all([
      count("profiles"),
      count("seller_profiles",[["status","pending"]]),
      count("creator_profiles",[["status","pending"]]),
      count("products",[["status","pending"]])
    ]);
    const results=[accounts,sellers,creators,products];
    const failure=results.find(result=>result.error);
    if(failure)throw failure.error;

    document.querySelector("#realAccounts").textContent=accounts.count??0;
    document.querySelector("#realSellerRequests").textContent=sellers.count??0;
    document.querySelector("#realCreatorRequests").textContent=creators.count??0;
    document.querySelector("#realProductRequests").textContent=products.count??0;
    status.textContent="Actualizado desde la base real";
  }catch(error){
    console.error("No fue posible cargar los indicadores reales.",error);
    status.textContent="No se pudieron cargar los datos";
  }
})();
