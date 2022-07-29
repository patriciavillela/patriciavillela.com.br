document.querySelectorAll("h2, h3").forEach(el => {
    el.addEventListener("click", (event) => {
        nextElementSibling = el.nextElementSibling;
        if(nextElementSibling.style.display === 'block') {
            nextElementSibling.style.display = 'none';
            el.classList.remove("aberto");
            el.classList.add("fechado");
        } else {
            nextElementSibling.style.display = 'block';
            el.classList.remove("fechado");
            el.classList.add("aberto");
        }
    })
})