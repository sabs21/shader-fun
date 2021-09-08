document.addEventListener("DOMContentLoaded", () => {
    const navButtons = document.getElementsByClassName("navButton");
    const selectionTextElems = document.getElementsByClassName("selectionText");
    const selectionTexts = [ "SET SAIL", "ABOUT ME", "GITHUB PROFILE", "ENJOY THE SUN" ];
    for (let i = 0; i < navButtons.length; i++) {
        navButtons[i].addEventListener("mouseenter", () => {
            // Replace old selectionText with the text that matches the button being hovered.
            for (let j = 0; j < selectionTextElems.length; j++) {
                selectionTextElems[j].innerText = selectionTexts[i];
                selectionTextElems[j].classList.add("active");
            }
        });
        navButtons[i].addEventListener("mouseleave", () => {
            // Replace old selectionText with the text that matches the button being hovered.
            for (let j = 0; j < selectionTextElems.length; j++) {
                selectionTextElems[j].classList.remove("active");
            }
        });
    }
});