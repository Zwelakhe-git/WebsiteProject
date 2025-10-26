async function insertRegForm(){
    let regForm = `
<form id="regForm">
    <div class="field">
        <label>Username</label>
        <input type="text" name="login" placeholder="login" required/>
    </div>
    <div class="field">
        <label>Email</label>
        <input type="email" name="email" placeholder="email" required/>
    </div>
    <div class="field">
        <label>Password</label>
        <input name="password" type="password" placeholder="password" required/>
    </div>
    <div controls>
        <button type="button" id="send-btn">Register</button>
        <button type="reset">clear</button>
        <button type="button" id="cancel-btn">Cancel</button>
    </div>
</form>`;
    let regPage = document.createElement("div");
    regPage.id = "reg-page";
    regPage.innerHTML = regForm;
    let bodyContainer = document.querySelector("#body");
    if(!bodyContainer){
        bodyContainer = document.body;
    }
    bodyContainer.appendChild(regPage);
    setTimeout(()=>{
        let cancelBtn = document.querySelector("#cancel-btn");
        let sendBtn = document.querySelector("#send-btn");
        if(!cancelBtn || !sendBtn){
            console.log("insertRegForm: control buttons not found");
            return;
        }

        cancelBtn.addEventListener("click", ()=>{
            bodyContainer.removeChild(regPage);
        });

        sendBtn.addEventListener("click", async () => {
            let form = document.querySelector("#regForm");
            if(!form){
                console.log("form sendBtn: form not found");
                return;
            }
            let formData = new FormData(form);
            
            for(const [key, value] of formData.entries()){
                if(value.length === 0){
                    alert("missing field: " + key);
                    return;
                }
            }
            try{
                let result = await registerViewer(formData)
                if(result){
                    // allow access
                    bodyContainer.removeChild(regPage);
                    alert("registration successful");
                }
                else {
                    alert("Please try again");
                }
            }catch(error){
                console.log("Error in register viewer: ", error);
                alert("registration error: " + error.message);
            }
        })
    }, 350);
}
async function accessAuthentification(){
    let accessForm = `
    <form id="accessForm">
    <div class="field">
        <label>Username</label>
        <input type="text" name="login" placeholder="login" required/>
    </div>
    <div class="field">
        <label>Access key</label>
        <input type="text" name="accessKey" placeholder="accesskey" required/>
    </div>
    <div class="field">
        <label>Password</label>
        <input name="password" type="password" placeholder="password" required/>
    </div>
    <div controls>
        <button type="button" id="send-btn">Watch</button>
        <button type="reset">clear</button>
        <button type="button" id="cancel-btn">Cancel</button>
    </div>
    </form>`;
    let regPage = document.createElement("div");
    regPage.id = "reg-page";
    regPage.innerHTML = accessForm;
    let bodyContainer = document.querySelector("#body");
    if(!bodyContainer){
        bodyContainer = document.body;
    }
    bodyContainer.appendChild(regPage);
    setTimeout(()=>{
        let cancelBtn = document.querySelector("#cancel-btn");
        let sendBtn = document.querySelector("#send-btn");
        if(!cancelBtn || !sendBtn){
            console.log("insertRegForm: control buttons not found");
            return;
        }

        cancelBtn.addEventListener("click", ()=>{
            bodyContainer.removeChild(regPage);
        });

        sendBtn.addEventListener("click", async () => {
            let form = document.querySelector("#accessForm");
            if(!form){
                console.log("form sendBtn: form not found");
                return;
            }
            let formData = new FormData(form);
            for(const [key, value] of formData.entries()){
                if(value.length === 0){
                    alert("missing field: " + key);
                    return;
                }
            }

            try{
                let result = await grantAccess(formData);
                if(result){
                    redirectToStreamingPage();
                }
            }catch(error){
                console.log(error);
            }
        })
    }, 350);
}

function redirectToStreamingPage(){
    getCurrentStreamKey()
    .then( sk => {
        let streamURL = `http://94.103.12.109:5080/WebRTCApp/play.html?id=${sk}`;
    	window.location.href = streamURL;
    }).catch( reason => {
        alert(reason.message);
    })
    
}

function getCurrentStreamKey(){
    return fetch('/php/dbReader.php?r=stream')
    .then( response => response.json())
    .then( streams => {
        let today = new Date().toISOString().split('T')[0];
        for(let i = 0; i < streams.length; ++i){
            if(streams[i].stream_date.split(' ')[0] === today){
                return streams[i].stream_key;
            }
        }
        throw new Error("No current streams for today");
    });
}

export default function streamingReg(){
    let registerBtn = document.querySelector("#reg-link");
    let playBtn = document.querySelector(".play-button");
    let watchBtn = document.querySelector("#watch-link");

    if(!registerBtn || !playBtn){
        console.log("register button not found");
        return;
    }
    registerBtn.addEventListener("click", ()=>{
        insertRegForm();
    });
    watchBtn.addEventListener("click", ()=>{
        accessAuthentification();
    });

    playBtn.addEventListener("click", ()=>{
        accessAuthentification();//access form
    });
}


//document.addEventListener("DOMContentLoaded", streamingReg);

async function registerViewer(formData){
    try{
        const response = await makeRequest("POST", '/php/viewerReg.php', formData);

        if(response.success){
            return response.success;
        }
        else{
            alert(response.message);
            return response.success;
        }
    }catch(error){
        console.log("error: " + error);
        return false;
    }
    return false;
}

async function grantAccess(formData){
    try{
        const response = await makeRequest("POST", '/php/streamAccess.php', formData);
        if(response.access === "granted"){
            return true;
        } else {
            alert(response.message);
            return false;
        }
    }catch(error){
        console.log(error);
        return false;
    }
}

function makeRequest(method, url, data){
    return new Promise((resolve, reject) => {
        var xmlHttp;
        if(window.ActiveXObject){
            xmlHttp = new ActiveXObject();
        }
        else{
            xmlHttp = new XMLHttpRequest();
        }
        xmlHttp.open(method, url, true);
        xmlHttp.responseType = "json";
        xmlHttp.onreadystatechange = function (){
            if(xmlHttp.readyState === 4){
                if(xmlHttp.status >= 200 && xmlHttp.status < 300){
                    var jsonResponse = xmlHttp.response;
                    resolve(jsonResponse);
                }
                else{
                    reject({
                        status: xmlHttp.status,
                        text: xmlHttp.statusText
                    });
                }
            }
        };

        xmlHttp.onerror = function (){
            reject({
                status: xmlHttp.status,
                text: xmlHttp.statusText
            });
            console.log("error when sending request");
        }

        xmlHttp.send(data);

    })
}
streamingReg();
