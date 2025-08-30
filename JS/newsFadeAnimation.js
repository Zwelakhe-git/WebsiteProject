document.addEventListener("DOMContentLoaded", ()=>{
  let globContainers = null;
  let current = null;
  let running = true;
  let animationTimer = null;
  let positionTimerId = null;
  let timeoutForNextItemId = null;
  const animationDelay = 10000;
  const fadeDuration = 3500 + 100;
  const positioningDelay = 700;

  const waitForNewsContent = () => {
    return new Promise((resolve) => {
      
      let observer = new MutationObserver(() => {
        let containers = document.querySelectorAll(".news-content");
        if(containers.length > 0){
          observer.disconnect();
          resolve(containers);
        }
      });
      observer.observe(document.querySelector("#last-news"), {childList : true, subtree : true});
    });
  }
  waitForNewsContent()
  .then(containers => {
    globContainers = containers;
    containers.forEach(container => {
      container.addEventListener("mouseenter",(event)=>{
        event.target.classList.add("mouseHover");
        try{
          if(timeoutForNextItemId){
            clearTimeout(timeoutForNextItemId);
            timeoutForNextItemId = null;
          }
          if(positionTimerId){
            clearTimeout(positionTimerId);
            positionTimerId = null;
          }
        }catch(Error){
          console.log("Error");
        }
        stop();
        
        index = Array.from(containers).indexOf(event.target) + 1;
        if(!event.target.classList.contains("selected")){
          event.target.classList.add("selected");
        }

        console.log("showing: " + event.target.style.backgroundColor);
      });
      
      container.addEventListener("mouseleave",(event)=>{
        event.target.classList.remove("mouseHover");
        start();
      });
    })

    runFadeAnimation();
    animationTimer = setInterval(runFadeAnimation, animationDelay);
  });
  
  function start(){
    if(!running){
      running = true;
      runFadeAnimation();
      animationTimer = setInterval(runFadeAnimation,animationDelay);
    }
  }
  function stop(){
    if(running){
      running = false;
      clearInterval(animationTimer);
      animationTimer = null;
    }
  }

  let index = 0;
  function runFadeAnimation(){
    try{
      if(current){
        current.classList.toggle("selected");
        timeoutForNextItemId = setTimeout(repositionItem, fadeDuration);
      }else{
        repositionItem();
      }
    }catch(TypeError){
      console.log("An error occured");
      console.log(index);
    }
    
  }

  function repositionItem(){
    if(index > globContainers.length - 1) index = 0;
    current = globContainers[index++];
    document.querySelector("#last-news").insertBefore(current, document.querySelectorAll(".news-content")[0]);
    positionTimerId = setTimeout(()=>{
      current.classList.toggle("selected");
    }, positioningDelay);
  }
});