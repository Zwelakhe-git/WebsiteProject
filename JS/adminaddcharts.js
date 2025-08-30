document.addEventListener("DOMContentLoaded", ()=>{
    let form = document.querySelector("#form-1");
    let formData = new FormData(form);

    const optionsDiv = document.querySelector("div.options");
    const imageInp = optionsDiv.querySelector("[name='imageFile']");
    const linkInp = optionsDiv.querySelector("[name='imageURL']");

    form.addEventListener("change", ()=>{
        formData = new FormData(form);
        if(formData.get("coverImg") === "file"){
            imageInp.style.display = "inline";
            linkInp.style.display = "none";
        }
        else if(formData.get("coverImg") === "link"){
            linkInp.style.display = "inline";
            imageInp.style.display = "none";
        }
    });
});