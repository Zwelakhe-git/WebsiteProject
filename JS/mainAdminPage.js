
document.querySelector("#top-bar-options-icon").addEventListener("click", (event)=>{
    const navBar = document.querySelector("#nav-bar");
    navBar.classList.toggle("opened");
    if(!navBar.classList.contains("opened")){
        navBar.style.maxWidth = "0px";
        navBar.style.padding = "0px";
        
    }else{
        navBar.style.maxWidth = "200px";
        navBar.style.padding = "20px 10px";
    }
});

let menuOptions = document.querySelectorAll("#nav-bar a");
menuOptions[0].classList.toggle("clicked");

menuOptions.forEach( editOpt => {
    editOpt.addEventListener("click", (event) => {
        document.querySelector("title").textContent = event.target.textContent;
        document.querySelectorAll("#nav-bar a").forEach(other => {
            if(other !== event.target){
                other.classList.remove("clicked");
            }
        });
        event.target.classList.toggle("clicked");
    });
});