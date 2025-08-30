// этот сценарий управляет интерфейсом.
// при добавлении услуг они появляются на экране.
// нужно тоже добавить возможность получение отображения уже
// существующих услуг и редактирования услуг.
document.addEventListener("DOMContentLoaded", ()=>{
    class Service{
        constructor(name,descr){
            this._name = name;
            this._descr = descr;
        }
    
        get name(){
            return this._name;
        }
        set name(value){
            this._name = value;
        }

        get description(){
            return this._descr;
        }
        set description(value){
            this._descr = value;
        }
    }
    // массив для добавления уже существующих услуг
    const services = [];

    const form = document.querySelector("#services-editor-form");
    let formData = new FormData(form);
    const addButton = document.querySelector("[name='addButton']");
    const leftSectDiv = document.querySelector("#left-sect");
    let servicesDiv = document.querySelector("#added-services");
    

    // обработчик для удаления услуги
    leftSectDiv.querySelector("#delete-icon").addEventListener("click", ()=>{

        servicesDiv.querySelectorAll(".service-item").forEach(item => {
            if(item.classList.contains("selected")){
                const servicename = item.querySelector(".serviceName").textContent;
                const descr = item.querySelector(".serviceDescr").textContent;

                // запускаем скрипт php для удаления из базы данных
                fetch("../php/deleteService.php",{
                    method : "POST",
                    body : new URLSearchParams({ name : servicename, description : descr }),
                    headers : {"Content-Type" : "application/x-www-form-urlencoded"} 
                }).then(response => response.text())
                .then(data => console.log(data));
                
                item.style.display = "none";
            }
        });
    });
    
    addButton.addEventListener("click", ()=>{
        formData = new FormData(form);
        let name = formData.get("name").trim();
        // создаем объект услуги только если есть название
        if(name.length !== 0 ){
            let service = new Service(name, formData.get("description").trim());
            services.push(service);
        }
        
        for(const service of Object.values(services)){
            let serviceSpans = servicesDiv.getElementsByClassName("serviceName");
            let serviceAdded = false;
            if(serviceSpans.length > 0){
                //добавляем только не существующие услуг в массив services
                for(const span of Object.values(serviceSpans)){
                    if(span.textContent === service.name){
                        serviceAdded = true;
                        break;
                    }
                }
            }
            if(!serviceAdded){
                let nameParagraph = document.createElement("span");
                let descrParagraph = document.createElement("p")
                let divItem = document.createElement("div");
                
                divItem.className = "service-item";
                nameParagraph.className = "serviceName";
                descrParagraph.className = "serviceDescr";
                
                descrParagraph.style.display = "none";

                nameParagraph.textContent = service.name;
                descrParagraph.textContent = service.description;

                divItem.appendChild(nameParagraph);
                divItem.appendChild(descrParagraph);
                servicesDiv.appendChild(divItem);
            }
        }
        
    });

    servicesDiv.querySelectorAll(".service-item").forEach(ele => {
        ele.addEventListener("click", ()=>{
            console.log(servicesDiv);
            
            servicesDiv.querySelectorAll(".service-item").forEach(other => {
                if(other !== ele){
                    other.classList.remove("selected");
                    other.querySelector(".serviceName").classList.remove("selected");
                    other.querySelector(".serviceDescr").style.display = "none";
                }
            });
            if(ele.classList.contains("selected")){
                ele.classList.remove("selected");
                ele.querySelector(".serviceName").classList.remove("selected");
                ele.querySelector(".serviceDescr").style.display = "none";
            }
            else{
                ele.classList.add("selected");
                ele.querySelector(".serviceName").classList.add("selected");
                ele.querySelector(".serviceDescr").style.display = "block";
            }
        })
    });

})