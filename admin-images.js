const openDrawerBase=openDrawer;
openDrawer=function(id){
  openDrawerBase(id);
  const item=reviewItems.find(entry=>entry.id===id);
  if(!item?.imageUrl)return;
  const preview=document.querySelector("#drawerPreview");
  preview.innerHTML="";
  const image=document.createElement("img");
  image.src=item.imageUrl;image.alt=item.imageAlt||item.title;preview.append(image);
};
