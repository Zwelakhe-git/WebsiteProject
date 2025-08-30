
document.addEventListener("DOMContentLoaded", ()=>{

    const waitForServicesToLoad = () => {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                const servicesList = document.querySelectorAll("#services-panel li");
                if(servicesList.length > 0){
                    observer.disconnect();
                    resolve(servicesList);
                }
            });
            observer.observe(document.body, { childList : true, subtree: true });
        });
    }
    waitForServicesToLoad().then(servicesList => {
        if(servicesList.length > 0){
            servicesList[0].classList.add("selected");
            servicesList.forEach(li => {
                li.addEventListener("click", () => {
                    
                    document.querySelectorAll("#about-service p").forEach( p => {
                        p.style.display = (p.getAttribute("for") !== li.getAttribute("id") ? "none": "block");
                    } );
                    servicesList.forEach(other => {
                        other.classList.remove("selected");
                    });
                    li.classList.add("selected");
                });
            });
        }
    });
    
    let vidLinks = document.querySelectorAll("a.video-link");
    vidLinks.forEach( a => {
        let url = "/blogsite/videos.html?";
        
        let vidElement = a.querySelector(".vid-item video");
        let safeVidPath = encodeURIComponent(vidElement.getAttribute("src"));
        let safeImgPath = encodeURIComponent(vidElement.getAttribute("poster"));
        url += `imgURL=${safeImgPath}&vidURL=${safeVidPath}`;
        a.href = url;
    })

    
    window.addEventListener("scroll",()=>{
        const topBar = document.querySelector("#top-bar");
        if(window.scrollY >= topBar.clientHeight + 10){
            topBar.setAttribute("style", "position:fixed;top:0;left:0");
        }
        else{
            topBar.removeAttribute("style");
        }
    });
    
});