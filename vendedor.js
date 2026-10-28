const stepLabels=["","Perfil público","Verificación","Condiciones","Primer producto"];
let currentStep=1;
let selectedCategory="Hogar";
const sellerCard=document.querySelector("#sellerCard");
const completionCard=document.querySelector("#completionCard");
const toast=document.querySelector("#saveToast");

function showToast(){toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),1800)}
function updateProgress(){
  document.querySelectorAll(".seller-step").forEach(section=>{const active=Number(section.dataset.step)===currentStep;section.hidden=!active;section.classList.toggle("active",active)});
  document.querySelectorAll(".seller-progress button").forEach(button=>{const number=Number(button.dataset.go);button.classList.toggle("active",number===currentStep);button.classList.toggle("done",number<currentStep)});
  document.querySelector("#mobileStep").textContent=`PASO ${currentStep} DE 4 · ${stepLabels[currentStep].toUpperCase()}`;
  document.querySelector("#progressBar").style.width=`${currentStep*25}%`;
  window.scrollTo({top:0,behavior:"smooth"});
}
function fieldValid(input){
  const label=input.closest("label");
  const error=label?.querySelector(".field-error");
  if(!error)return input.validity.valid;
  if(input.validity.valueMissing)error.textContent="Este dato es necesario.";
  else if(input.validity.patternMismatch)error.textContent="Revisa el formato de este dato.";
  else if(input.validity.tooShort)error.textContent=`Escribe al menos ${input.minLength} caracteres.`;
  else if(input.validity.rangeUnderflow)error.textContent=`El mínimo es ${input.min}.`;
  else error.textContent="";
  input.setAttribute("aria-invalid",String(!input.validity.valid));
  return input.validity.valid;
}
function validateForm(selector){return [...document.querySelectorAll(`${selector} input[required],${selector} textarea[required],${selector} select[required]`)].map(fieldValid).every(Boolean)}
function validateCurrent(){
  if(currentStep===1)return validateForm("#profileForm");
  if(currentStep===2)return validateForm("#verificationForm");
  if(currentStep===3){
    const valid=document.querySelector("#commissionAgreement").checked&&document.querySelector("#rulesAgreement").checked;
    document.querySelector("#agreementError").textContent=valid?"":"Confirma ambos puntos para continuar.";
    return valid;
  }
  return true;
}
function nextStep(){if(!validateCurrent())return;currentStep=Math.min(4,currentStep+1);updateProgress();showToast()}
function previousStep(){currentStep=Math.max(1,currentStep-1);updateProgress()}
document.querySelectorAll("[data-next]").forEach(button=>button.addEventListener("click",nextStep));
document.querySelectorAll("[data-back]").forEach(button=>button.addEventListener("click",previousStep));
document.querySelectorAll(".seller-form input,.seller-form textarea,.seller-form select").forEach(input=>input.addEventListener("blur",()=>{if(input.required)fieldValid(input)}));
document.querySelectorAll(".seller-progress button").forEach(button=>button.addEventListener("click",()=>{const target=Number(button.dataset.go);if(target<=currentStep){currentStep=target;updateProgress()}}));

const storeName=document.querySelector("#storeName");
const storeSlug=document.querySelector("#storeSlug");
const storeBio=document.querySelector("#storeBio");
const storeCity=document.querySelector("#storeCity");
function slugify(value){return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,30)}
storeName.addEventListener("input",()=>{document.querySelector("#previewName").textContent=storeName.value||"Tu tienda";document.querySelector("#previewInitial").textContent=(storeName.value.trim()[0]||"T").toUpperCase();if(!storeSlug.dataset.edited)storeSlug.value=slugify(storeName.value)});
storeSlug.addEventListener("input",()=>{storeSlug.dataset.edited="true";storeSlug.value=slugify(storeSlug.value)});
storeBio.addEventListener("input",()=>{document.querySelector("#previewBio").textContent=storeBio.value||"Tu presentación aparecerá aquí.";document.querySelector("#bioCount").textContent=storeBio.value.length});
storeCity.addEventListener("input",()=>document.querySelector("#previewCity").textContent=storeCity.value||"Tu ciudad");
document.querySelectorAll("#categoryChoices button").forEach(button=>button.addEventListener("click",()=>{selectedCategory=button.dataset.value;document.querySelectorAll("#categoryChoices button").forEach(item=>item.classList.toggle("selected",item===button));document.querySelector("#previewCategory").textContent=selectedCategory}));

const productTitle=document.querySelector("#productTitle");
const productCategory=document.querySelector("#productCategory");
const productPrice=document.querySelector("#productPrice");
productTitle.addEventListener("input",()=>document.querySelector("#draftTitle").textContent=productTitle.value||"Tu producto");
productCategory.addEventListener("change",()=>document.querySelector("#draftCategory").textContent=(productCategory.value||"Categoría").toUpperCase());
productPrice.addEventListener("input",()=>document.querySelector("#draftPrice").textContent=`$${Number(productPrice.value||0).toLocaleString("es-MX")} MXN`);

document.querySelector("#submitStore").addEventListener("click",async()=>{
  if(!validateForm("#productForm"))return;
  const button=document.querySelector("#submitStore");
  const status=document.querySelector("#sellerSubmitStatus");
  button.disabled=true;button.textContent="ENVIANDO…";status.textContent="";status.className="seller-submit-status";
  const session=await window.sellerAccessReady;
  if(!session){button.disabled=false;button.textContent="ENVIAR BORRADOR A REVISIÓN";return}
  const client=window.bazarSupabase;
  const storeData={account_id:session.user.id,store_name:storeName.value.trim(),slug:storeSlug.value.trim(),bio:storeBio.value.trim(),category:selectedCategory,status:"pending"};
  const{data:seller,error:sellerError}=await client.from("seller_profiles").upsert(storeData,{onConflict:"account_id"}).select("id").single();
  if(sellerError){
    status.textContent=sellerError.code==="23505"?"Esa dirección pública ya está ocupada. Elige otra.":"No pudimos guardar la tienda. Revisa la información e inténtalo de nuevo.";
    status.classList.add("error");button.disabled=false;button.textContent="ENVIAR BORRADOR A REVISIÓN";return;
  }
  await client.from("profiles").update({city:storeCity.value.trim()}).eq("id",session.user.id);
  const productSlug=`${storeSlug.value.trim()}-${slugify(productTitle.value)}-${Date.now().toString(36)}`;
  const productData={seller_id:seller.id,name:productTitle.value.trim(),slug:productSlug,description:document.querySelector("#productDescription").value.trim(),delivery_note:document.querySelector("#productDelivery").value,category:productCategory.value,kind:document.querySelector("#productType").value,price_cents:Math.round(Number(productPrice.value)*100),stock:Number(document.querySelector("#productStock").value),status:"pending"};
  const{error:productError}=await client.from("products").insert(productData);
  if(productError){
    status.textContent="La tienda se guardó, pero el producto necesita otro intento.";status.classList.add("error");button.disabled=false;button.textContent="ENVIAR BORRADOR A REVISIÓN";return;
  }
  sessionStorage.setItem("bazarViralSellerDemo",JSON.stringify({store:storeName.value.trim(),category:selectedCategory,product:productTitle.value.trim()}));
  document.querySelector("#completeStore").textContent=storeName.value.trim();
  sellerCard.hidden=true;document.querySelector(".seller-sidebar").hidden=true;completionCard.hidden=false;window.scrollTo({top:0,behavior:"smooth"});
});
document.querySelector("#editDraft").addEventListener("click",()=>{completionCard.hidden=true;document.querySelector(".seller-sidebar").hidden=false;sellerCard.hidden=false;currentStep=4;updateProgress()});
updateProgress();
