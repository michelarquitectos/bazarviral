const tabs=document.querySelectorAll("[data-tab]");
const panels=document.querySelectorAll("[data-panel]");
const search=document.querySelector("#trustSearch");
function renderFaq(topic=""){
  const terms=`${search.value} ${topic}`.trim().toLocaleLowerCase("es").split(/\s+/).filter(Boolean);
  let visible=0;
  document.querySelectorAll("#faqList article").forEach(article=>{
    const text=`${article.textContent} ${article.dataset.tags}`.toLocaleLowerCase("es");
    const show=terms.every(term=>text.includes(term));
    article.hidden=!show;
    if(show)visible++;
  });
  document.querySelector("#faqEmpty").hidden=visible>0;
}
function openTab(name){
  tabs.forEach(button=>button.classList.toggle("active",button.dataset.tab===name));
  panels.forEach(panel=>{panel.hidden=panel.dataset.panel!==name;panel.classList.toggle("active",panel.dataset.panel===name)});
  if(name!=="help")search.value="";else renderFaq();
}
tabs.forEach(button=>button.onclick=()=>openTab(button.dataset.tab));
document.querySelectorAll(".faq-list article>button").forEach(button=>button.onclick=()=>{
  const answer=button.nextElementSibling,willOpen=answer.hidden;
  document.querySelectorAll(".faq-list article>div").forEach(item=>item.hidden=true);
  document.querySelectorAll(".faq-list article>button b").forEach(item=>item.textContent="＋");
  answer.hidden=!willOpen;
  button.querySelector("b").textContent=willOpen?"−":"＋";
});
search.oninput=()=>{openTab("help");renderFaq()};
document.querySelectorAll("[data-topic]").forEach(button=>button.onclick=()=>{
  openTab("help");search.value=button.dataset.topic;renderFaq();
  document.querySelectorAll("[data-topic]").forEach(item=>item.classList.toggle("active",item===button));
});
document.querySelector("#clearTrustSearch").onclick=()=>{search.value="";renderFaq()};
const modal=document.querySelector("#helpModal"),backdrop=document.querySelector("#helpBackdrop"),toast=document.querySelector("#toast");
function close(){modal.hidden=true;backdrop.hidden=true;document.body.style.overflow=""}
function notify(message){toast.textContent=message;toast.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove("show"),2000)}
document.querySelector("#contactHelp").onclick=()=>{modal.hidden=false;backdrop.hidden=false;document.body.style.overflow="hidden"};
document.querySelectorAll("#closeHelp,[data-close-help]").forEach(button=>button.onclick=close);
backdrop.onclick=close;
document.querySelector("#sendHelp").onclick=()=>{if(!document.querySelector("#helpForm").reportValidity())return;close();notify("Solicitud preparada en esta demostración")};
const hash=location.hash.slice(1);
openTab(["help","terms","privacy"].includes(hash)?hash:"help");
