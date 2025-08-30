document.addEventListener("DOMContentLoaded", () => {
    if(window.ActiveXObject){
        xmlHttp = new ActiveXObject();
    }
    else{
        xmlHttp = new XMLHttpRequest();
    }

    if(!xmlHttp){
        console.log("Failed to create request object");
        exit();
    }
    xmlHttp.responseType = "json";
    sendRequest();

    function sendRequest(){
        if(xmlHttp.readyState == 4 || xmlHttp.readyState == 0){
            try{
                xmlHttp.open("GET","http://localhost/blogsite/php/dbReader.php", true);
                xmlHttp.send(null);
                xmlHttp.onreadystatechange = resposeHandler;
            }catch(e){
                alert("Exception when sending request");
            }
        }
    }

    function resposeHandler(){
        if(xmlHttp.readyState == 4){
            if(xmlHttp.status === 200){
                let response = xmlHttp.response;
                if(typeof response === "object"){
                    for(const [contentName, content] of Object.entries(response)){
                        let container = null;
                        let inlineHTML = null;
                        let targetContainer = null;
                        
                        switch(contentName){
                            case "musicContent":
                                // сначала выбираем целевой контейнер, потом проверяем, есть ли
                                // контейнеры media-row-content. если есть, то проверяем, какой не имеет
                                // видео контент. туда будем поставлять наш видео. если у всех есть видео контент
                                // или нет таких контейнеров media-row-content, то мы будем создать новый.
                                // видео элемент будет первым потомком.
                                
                                targetContainer = document.querySelector("#music-charts-video");
                                
                                
                                for(const index in content){
                                    
                                    for(const row of targetContainer.querySelectorAll(".media-row-content")){
                                        if(row.querySelector(".vid-content") === null && container === null){
                                            container = row;
                                            break;
                                        }
                                    };
                                    if(container === null){
                                        container = document.createElement("div");
                                        container.classList.add("media-row-content");
                                        targetContainer.appendChild(container);
                                    }

                                    inlineHTML ="<div class=\"vid-content\">";
                                    inlineHTML += `<a class="video-link"><div class="vid-item">
                                       <video type="${content[index].videoType}" poster="${content[index].coverImage}" src="${content[index].videoLocation}"></video>`
                                    + `<p style="display:none">${content[index].description}</p>`
                                    + "</div></a></div>";
                                    container.innerHTML = inlineHTML + container.innerHTML;
                                    container = null;
                                }
                                
                                break;
                            case "services":
                                container = document.querySelector("#services-list-details");
                                inlineHTML = "";
                                for(const index in content){
                                    inlineHTML += `<div class="service-category" id="service-${index+1}">
                                    <h3>${content[index].name}</h3>
                                    <div class="service-image"></div>
                                    <div id=\"about-service\">
                                        <p for="service-${index+1}" style="display:none">
                                                        ${content[index].description}
                                        </p>
                                    </div></div>`;
                                }
                                container.innerHTML += inlineHTML;
                                break;
                            case "news":
                                targetContainer = document.querySelector("#last-news");
                                if(targetContainer === null){
                                    console.log("news container is empty. check your CSS selector");
                                }
                                
                                for(const index in content){
                                    container = document.createElement("div");
                                    container.classList.add("news-content");
                                    
                                    inlineHTML = `<a href="" class="news-content-link">
                                    <img src="${content[index].coverImage}" alt="news cover image" type="${content[index].imageType}">
                                    <div class="news-image-background" style="background-image:url('${content[index].coverImage}')"></div>
                                    </a>
                                    `;
                                    inlineHTML += `<div class="news-headline"><h1>${content[index].newsHeadline}</h1></div>`;
                                    container.innerHTML = inlineHTML;
                                    targetContainer.appendChild(container);
                                }
                                
                                
                                break;
                        }
                    }
                }
                else{
                    alert("Unexpected response type. expected " + xmlHttp.responseType);
                }
            }else{
                console.log("Failed to connect to server. error code : " + xmlHttp.status);
            }
        }
    }
});