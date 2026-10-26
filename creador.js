const stepLabels=["","Perfil público","Autenticidad","Campañas","Primer video"];
let currentStep=1;
let selectedTopic="Hallazgos virales";
const creatorCard=document.querySelector("#creatorCard");
const completionCard=document.querySelector("#completionCard");
const toast=document.querySelector("#saveToast");

function showToast(){toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),1800)}
function updateProgress(){document.querySelectorAll(".seller-step").forEach(section=>{const active=Number(section.dataset.step)===currentStep;section.hidden=!active;section.classList.toggle("active",active)});document.querySelectorAll(".seller-progress button").forEach(button=>{const number=Number(button.dataset.go);button.classList.toggle("active",number===currentStep);button.classList.toggle("done",number<currentStep)});document.querySelector("#mobileStep").textContent=`PASO ${currentStep} DE 4 · ${stepLabels[currentStep].toUpperCase()}`;document.querySelector("#progressBar").style.width=`${currentStep*25}%`;window.scrollTo({top:0,behavior:"smooth"})}
function fieldValid(input){const error=input.closest("label")?.querySelector(".field-error");if(!error)return input.validity.valid;if(input.validity.valueMissing)error.textContent="Este dato es necesario.";else if(input.validity.typeMismatch)error.textContent="Escribe un enlace válido que comience con https://";else if(input.validity.patternMismatch)error.textContent="Revisa el formato de este dato.";else if(input.validity.tooShort)error.textContent=`Escribe al menos ${input.minLength} caracteres.`;else error.textContent="";input.setAttribute("aria-invalid",String(!input.validity.valid));return input.validity.valid}
function validateForm(selector){return [...document.querySelectorAll(`${selector} input[required],${selector} textarea[required],${selector} select[required]`)].map(fieldValid).every(Boolean)}
function validateCurrent(){if(currentStep===1)return validateForm("#creatorProfileForm");if(currentStep===2)return validateForm("#authenticityForm");if(currentStep===3){const valid=document.querySelector("#campaignAgreement").checked&&document.querySelector("#originalityAgreement").checked;document.querySelector("#agreementError").textContent=valid?"":"Confirma ambos puntos para continuar.";return valid}return true}
function nextStep(){if(!validateCurrent())return;currentStep=Math.min(4,currentStep+1);updateProgress();showToast()}
function previousStep(){currentStep=Math.max(1,currentStep-1);updateProgress()}
document.querySelectorAll("[data-next]").forEach(button=>button.addEventListener("click",nextStep));
document.querySelectorAll("[data-back]").forEach(button=>button.addEventListener("click",previousStep));
document.querySelectorAll(".seller-form input,.seller-form textarea,.seller-form select").forEach(input=>input.addEventListener("blur",()=>{if(input.required)fieldValid(input)}));
document.querySelectorAll(".seller-progress button").forEach(button=>button.addEventListener("click",()=>{const target=Number(button.dataset.go);if(target<=currentStep){currentStep=target;updateProgress()}}));

const creatorName=document.querySelector("#creatorName");
const creatorHandle=document.querySelector("#creatorHandle");
const creatorBio=document.querySelector("#creatorBio");
function handleify(value){return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9._-]+/g,"").slice(0,24)}
creatorName.addEventListener("input",()=>{document.querySelector("#previewCreatorName").textContent=creatorName.value||"Tu nombre creativo";document.querySelector("#previewCreatorInitial").textContent=(creatorName.value.trim()[0]||"C").toUpperCase();if(!creatorHandle.dataset.edited){creatorHandle.value=handleify(creatorName.value);document.querySelector("#previewCreatorHandle").textContent=`@${creatorHandle.value||"tuusuario"}`}});
creatorHandle.addEventListener("input",()=>{creatorHandle.dataset.edited="true";creatorHandle.value=handleify(creatorHandle.value);document.querySelector("#previewCreatorHandle").textContent=`@${creatorHandle.value||"tuusuario"}`});
creatorBio.addEventListener("input",()=>{document.querySelector("#previewCreatorBio").textContent=creatorBio.value||"Tu presentación aparecerá aquí.";document.querySelector("#creatorBioCount").textContent=creatorBio.value.length});
document.querySelectorAll("#topicChoices button").forEach(button=>button.addEventListener("click",()=>{selectedTopic=button.dataset.value;document.querySelectorAll("#topicChoices button").forEach(item=>item.classList.toggle("selected",item===button));document.querySelector("#previewCreatorTopic").textContent=selectedTopic}));

const campaignSelect=document.querySelector("#campaignSelect");
const contentPlatform=document.querySelector("#contentPlatform");
const contentTitle=document.querySelector("#contentTitle");
campaignSelect.addEventListener("change",()=>document.querySelector("#previewCampaign").textContent=campaignSelect.value||"Selecciona una campaña");
contentPlatform.addEventListener("change",()=>document.querySelector("#previewPlatform").textContent=(contentPlatform.value||"Plataforma").toUpperCase());
contentTitle.addEventListener("input",()=>document.querySelector("#previewContentTitle").textContent=contentTitle.value||"Tu idea de contenido");
document.querySelector("#submitCreator").addEventListener("click",()=>{const disclosure=document.querySelector("#disclosure");const formValid=validateForm("#contentForm");document.querySelector("#disclosureError").textContent=disclosure.checked?"":"Confirma que incluirás el aviso de comisión.";if(!formValid||!disclosure.checked)return;sessionStorage.setItem("bazarViralCreatorDemo",JSON.stringify({creator:creatorName.value.trim(),topic:selectedTopic,campaign:campaignSelect.value}));document.querySelector("#completeCreator").textContent=creatorName.value.trim();creatorCard.hidden=true;document.querySelector(".seller-sidebar").hidden=true;completionCard.hidden=false;window.scrollTo({top:0,behavior:"smooth"})});
document.querySelector("#editCreatorDraft").addEventListener("click",()=>{completionCard.hidden=true;document.querySelector(".seller-sidebar").hidden=false;creatorCard.hidden=false;currentStep=4;updateProgress()});
updateProgress();
