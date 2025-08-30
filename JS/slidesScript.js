document.addEventListener("DOMContentLoaded", ()=>{
  
const container = document.querySelector("#news-slides");
let slideImages = container.children;

const slideCount = slideImages.length;

let count = 0;
let timer = setInterval(() => {
  if(count >= slideCount){
    container.scrollTo({
      left : slideImages.item(count).offsetLeft,
      behavior : "smooth"
    });
    container.insertBefore(slideImages.item(count).cloneNode(true), null);
    setTimeout(() => {
      container.scrollLeft = 0;
      Array.from(slideImages).slice(0, count)
      .forEach(img => {
        container.removeChild(img);
      });
      count = 1;
    },1000);
  }
  else{
    container.scrollTo({
      left : slideImages.item(count++).offsetLeft,
      behavior : "smooth"
    });

    container.insertBefore(slideImages.item(count - 1).cloneNode(true), null);
  }
},4000);

});