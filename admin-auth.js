window.adminAccessReady=(async()=>{
  const client=window.bazarSupabase;
  const accountPage="cuenta.html";

  try{
    const{data:{session}}=await client.auth.getSession();
    if(!session){
      window.location.replace(`${accountPage}?acceso=administracion`);
      return;
    }

    const{data,error}=await client
      .from("account_roles")
      .select("role")
      .eq("account_id",session.user.id)
      .eq("role","admin");

    if(error||!data?.length){
      window.location.replace(`${accountPage}?sin_permiso=administracion`);
      return;
    }

    document.documentElement.classList.remove("auth-check");
    const name=session.user.user_metadata?.display_name||"Administración";
    const profileName=document.querySelector(".admin-profile strong");
    if(profileName)profileName.textContent=name;

    document.querySelector("#adminSignOut")?.addEventListener("click",async()=>{
      await client.auth.signOut();
      window.location.replace(accountPage);
    });
    return session;
  }catch(error){
    console.error("No fue posible verificar el acceso administrativo.",error);
    window.location.replace(`${accountPage}?error=sesion`);
  }
})();
