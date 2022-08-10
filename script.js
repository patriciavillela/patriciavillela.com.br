document.querySelectorAll("h2, h3").forEach(el => {
    el.addEventListener("click", (event) => {
        nextElementSibling = el.nextElementSibling;
        if(nextElementSibling.style.display === 'none') {
            nextElementSibling.style.display = 'block';
            el.classList.add("aberto");
            el.classList.remove("fechado");
        } else {
            nextElementSibling.style.display = 'none';
            el.classList.remove("aberto");
            el.classList.add("fechado");
        }
    })
})