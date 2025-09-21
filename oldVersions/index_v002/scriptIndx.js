import {setEventHandlers} from './audScript.js'

const scriptIndx = () => {
    const headDiv = document.querySelector("#head");

    headDiv.innerHTML += `<a href="" class="link no-dec">
        <span>see all</span>
        <ion-icon name="chevron-forward-outline"></ion-icon>
      </a>`;
    setScrollButtons(headDiv);

    if(window.innerWidth <= 768){
        setSubscriptionPanel(true, "btm", false);
    }
    setTopBar();
    setSecInfo();
    giveSecsClasses();
    stylemiddlePanelCharts();
    setRightPanel();
    setPartnersAnimation();
    setEventHandlers();

};

// fading head
function setFadingTitle(headDiv){
    const ess = document.createElement("div");
    ess.classList.add("flxDisp");
    ess.id = "fadingTitle";
    
    headDiv.insertAdjacentElement("afterbegin", ess);
    ess.innerHTML = ess.innerHTML = "<h2 class='no-margin'>ESSENTIALS</h2>";

    ess.style.marginBottom = "5px";
    ess.style.justifyContent = "center";
    
}

// scroll buttons
function setScrollButtons(headDiv){
    headDiv.querySelectorAll(".scroll-btn").forEach(
        btn => {
            if(btn.classList.contains("right")){
                btn.innerHTML = "<ion-icon name='arrow-forward-outline' class='icon'></ion-icon>";
            }
            else if(btn.classList.contains("left")){
                btn.innerHTML = "<ion-icon name='arrow-back-outline' class='icon'></ion-icon>";
            }
            
        }
    );
}

// sections
function giveSecsClasses(){
    document.querySelectorAll(".app > div").forEach(
        secDiv => {
            if(secDiv.id !== "footer" && secDiv.id !== "top-bar"){
                if(secDiv.id !== "head" && secDiv.id !== "nav-panel"){
                    secDiv.classList.add("opt-width-marg", "margin-rl-1");
                }
                else if(secDiv.id === "navPanel"){
                    secDiv.classList.add("opt-width-nomarg");
                }
            }
        }
    );
}


// top bar
function setTopBar(){
    const threeBarsIco = "<ion-icon name='reorder-three-outline' class='opts-icon'></ion-icon>";
    const iconContainer = document.createElement("div");
    
    iconContainer.classList.add("icon-container");
    iconContainer.innerHTML = threeBarsIco;
    
    const searchBar = document.createElement("div");
    searchBar.classList.add("search-bar", "flxDisp");
    searchBar.innerHTML = `<div class="input search-inp no-outln no-bdr full-w">
    <span>Search</span>
    </div>
    <ion-icon name="search-outline" class="fnt24"></ion-icon>`;

    // container for holding social links and search bar
    const SrchBarLinksCont = document.createElement("div");
    SrchBarLinksCont.classList.add("container", "links", "search", "flxDisp");

    const contactLinks = `<div class="social evenFlx">
    <ion-icon name="logo-facebook"></ion-icon>
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0,0,256,256">
<g fill="#ffffff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(8.53333,8.53333)"><path d="M26.37,26l-8.795,-12.822l0.015,0.012l7.93,-9.19h-2.65l-6.46,7.48l-5.13,-7.48h-6.95l8.211,11.971l-0.001,-0.001l-8.66,10.03h2.65l7.182,-8.322l5.708,8.322zM10.23,6l12.34,18h-2.1l-12.35,-18z"></path></g></g>
</svg>
    <ion-icon name="logo-instagram"></ion-icon>
    
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
    <g fill="#ffffff"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M427.5 299.7C429.7 300.6 431.7 301.6 433.8 302.5C463 316.6 484.4 337.7 495.6 363.9C511.3 400.4 512.8 459.7 465.3 507.1C429.1 543.3 385 559.6 322.7 560.1L322.4 560.1C252.2 559.6 198.3 536 162 489.9C129.7 448.9 113.1 391.8 112.5 320.3L112.5 319.8C113 248.3 129.6 191.2 161.9 150.2C198.2 104.1 252.2 80.5 322.4 80L322.7 80C393 80.5 447.6 104 485 149.9C503.4 172.6 517 199.9 525.6 231.6L485.2 242.4C478.1 216.6 467.4 194.6 453 177C423.8 141.2 380 122.8 322.5 122.4C265.5 122.9 222.4 141.2 194.3 176.8C168.1 210.1 154.5 258.3 154 320C154.5 381.7 168.1 429.9 194.3 463.3C222.3 498.9 265.5 517.2 322.5 517.7C373.9 517.3 407.9 505.1 436.2 476.8C468.5 444.6 467.9 405 457.6 380.9C451.5 366.7 440.5 354.9 425.7 346C422 372.9 413.9 394.3 401 410.8C383.9 432.6 359.6 444.4 328.3 446.1C304.7 447.4 282 441.7 264.4 430.1C243.6 416.3 231.4 395.3 230.1 370.8C227.6 322.5 265.8 287.8 325.3 284.4C346.4 283.2 366.2 284.1 384.5 287.2C382.1 272.4 377.2 260.6 369.9 252C359.9 240.3 344.3 234.3 323.7 234.2L323 234.2C306.4 234.2 284 238.8 269.7 260.5L235.3 236.9C254.5 207.8 285.6 191.8 323.1 191.8L323.9 191.8C386.5 192.2 423.8 231.3 427.6 299.5L427.4 299.7L427.5 299.7zM271.5 368.5C272.8 393.6 299.9 405.3 326.1 403.8C351.7 402.4 380.7 392.4 385.6 330.6C372.4 327.7 357.8 326.2 342.2 326.2C337.4 326.2 332.6 326.3 327.8 326.6C284.9 329 270.6 349.8 271.6 368.4L271.5 368.5z"/></g>
    </svg>
    <i class="fa-brands fa-tiktok"></i>
    <ion-icon name="logo-youtube"></ion-icon>
    </div>`;
    SrchBarLinksCont.appendChild(searchBar);
    SrchBarLinksCont.innerHTML += contactLinks;

    const tbCont = document.querySelector("#top-bar-content");
    tbCont.appendChild(SrchBarLinksCont);
    tbCont.appendChild(iconContainer);

    iconContainer.querySelector(".opts-icon").addEventListener("click", event => {
        const navPanel = document.querySelector("#nav-panel");
        navPanel.classList.toggle("open");
        if(navPanel.classList.contains("open")){
            navPanel.style.display = "block";
            navPanel.style.maxHeight = `${navPanel.scrollHeight}px`;
        }
        else{
            navPanel.style.maxHeight = "0px";
            setTimeout(() => {
                navPanel.style.display = "none";
            }, 350);
        }
    });
}


// section info
function setSecInfo(){
    document.querySelectorAll(".section-info h1").forEach(
        heading => {
            heading.classList.add("no-margin");
        }
    );
}

function stylemiddlePanelCharts(){
    // installing classes
    document.querySelectorAll(".music-track p").forEach( p => {
        p.classList.add("no-margin");
    })
    
    document.querySelectorAll(".music-track").forEach( p => {
        p.classList.add("flxDisp");
    })
    document.querySelectorAll(".audio-charts").forEach( p => {
        p.classList.add("flxDisp");
    })
}

function setRightPanel(){
    // right panel
    const rpDiv = document.querySelector("#link-portrait-video");
    rpDiv.classList.add("flxDisp");

    let rpCont =  `<div class="vid-container">
    <div class="icon-bg abs-pos vid-cvr flxDisp cntr">
        <ion-icon name="play" class="vid-ctrl"></ion-icon>
    </div>
        <video class="html5-vid" poster="https://avatars.mds.yandex.net/i?id=abb9204e9617046cb07b2d7343a99d178fa22085-8514130-images-thumbs&n=13" src="" muted></video>
    </div>`;
    rpDiv.innerHTML += rpCont;
}

// subscription
function setSubscriptionPanel(vidBG, pos, showTitle){
    const div = document.createElement("div");
    div.id = `sub-section-${pos}`;
    //"opt-width-marg","margin-rl-1"
    div.classList.add("flxDisp");
    let inlineHtml = `${ showTitle ? `<div class="section-info">
        <h1>SUBSCRIBE</h1>
        </div>` : ""
        }
        <div class="sub flxDisp full-w-h" ${pos === "top" ? "style='background-color: #d2cccc; border-radius: 10px'" : ""}>
        ${vidBG ? `<div class="sub-bg flxDisp full-w-h">
            <video class="html-bg-vid full-w-h"
             type="video/mp4" src="/media/videos/file.mp4" 
              
              autoPlay
              muted
              loop>
            </video>
        </div>` : ""}
        <div class="flxDisp contnform">
            <div class="sub-text flxDisp">
                <p class="p-big">
                    Abone pou resevwa kontni eksklizif nou yo.
                </p>
                <p class="p-sml">
                "Kelkeswa gwose biznis ou a oswa domen w ap evolye a, 
                    nou gen konpetans ak ekspetiz nesese pou n ede
                    w reyisi nan mond dijital la."
                </p>
            </div>
            <form class="subform flxDisp" method="POST">
                <div class="sub-inpF flxDisp">
                    <label>Email*</label>
                    <input type="email" name="clientemail" required=""/>
                </div>
                <div class="mail-sub flxDisp">
                    <input type="checkbox" name="emailSub"/>
                    <label for="emailSub">yes, subscribe me to your newsletters</label>
                </div>
                <div class="form-btns flxDisp">
                    <button type="send" id="emailSndBtn" class="full-w">Send</button>
                </div>
            </form>
        </div>
      </div>
      
      <div class="gap" id="sub-gap-${pos}"></div>`;

      div.innerHTML = inlineHtml;

    switch(pos){
        case "top":
            let partnersDiv = document.querySelector("#events-section");
            
            if(partnersDiv){
                try{
                    document.body.insertBefore(div, partnersDiv);
                }catch(error){
                    console.log(error.message);
                }
            }
            else{
                console.log("partners div not found");
            }
            break;
        case "btm":
            let eventsDiv = document.querySelector("#partners-panel");
            if(eventsDiv){
                try{
                    document.body.insertBefore(div, eventsDiv);
                }catch(error){
                    console.log(error.message);
                }
            }
            else{
                console.log("events div not found");
            }
            
            break;
    }
}

function setPartnersAnimation(){
    // partners
    let inlineHtml = `<div id="partners-list" class="partners">
    <img src="/media/images/partners/LE PLAZA.JPG" alt="Le Plaza Hotel">
    <img src="/media/images/partners/shekina_.JPG" alt="Shekinah FM">
    <img src="/media/images/partners/CHOUKOUN.JPG" alt="Choucoune">
    <img src="/media/images/partners/MD.JPG" alt="Mairie de Delmas">
    <img src="/media/images/partners/NINA.JPG" alt="Nina Hairstyling">
    </div>`;

    document.querySelector("#partners-panel").innerHTML += inlineHtml;

    // const partnerImgs = document.querySelectorAll(".partners img");
    // if(partnerImgs.length === 0){
    //     console.error("no partner images found");
    //         exit;
    //     }
    //     let beepAnim = setInterval( () => {
    //         partnerImgs.forEach( img => {
    //             img.classList.toggle("beep");
    //         });
    //     }, 505);
}

export default scriptIndx;