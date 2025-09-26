const search_bar = document.querySelector("#search_bar");
const nav = document.querySelector(".nav");
const intro = document.querySelector(".intro");
const open_icon = document.querySelector(".open_icon");



open_icon.addEventListener("click", function() {
    if (nav.classList.contains("close")){
        nav.classList.add("open");
        nav.classList.remove("close");

   }else{
        nav.classList.add("close");
        nav.classList.remove("open");
    }
})

if (intro.classList.contains("bottom")){
    document.querySelector(".app_name").textContent="";
    document.querySelector(".app_info").textContent="";

}

