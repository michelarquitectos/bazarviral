window.sellerAccessReady=(async()=>{
  const{data:{session}}=await window.bazarSupabase.auth.getSession();
  if(!session){
    window.location.replace("cuenta.html?acceso=vendedor");
    return null;
  }
  document.documentElement.classList.remove("auth-check");
  return session;
})().catch(error=>{
  console.error("No fue posible verificar la sesión del vendedor.",error);
  window.location.replace("cuenta.html?error=sesion");
  return null;
});
