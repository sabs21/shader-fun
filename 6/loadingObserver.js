document.addEventListener("DOMContentLoaded", () => {
    const loadingUI = document.getElementById("loadingUI");
    const sunsetUI = document.getElementById("sunsetUI");
    const mapUI = document.getElementById("mapUI");

    // Select the node that will be observed for mutations
    const shipWheelElem = document.getElementById('shipWheel');
    let totalLoaded = 0;

    // Options for the observer (which mutations to observe)
    const config = { attributes: true };

    // Callback function to execute when mutations are observed
    const callback = function(mutationsList, observer) {
        for(const mutation of mutationsList) {
            //console.log(parseInt(shipWheelElem.getAttribute("totalLoaded")));
            if (parseInt(shipWheelElem.getAttribute("totalLoaded")) != totalLoaded) {
                totalLoaded = parseInt(shipWheelElem.getAttribute("totalLoaded"));
                // Expand the gradient to display that the scene is loading
                shipWheelElem.style = "background: radial-gradient(#fc8c03 " + totalLoaded + "%, #ffffff " + (totalLoaded*2) + "%);";
                //console.log("radial-gradient(#e66465 " + totalLoaded + "%, #9198e5 " + (totalLoaded*2) + "%);");
            }
            if (totalLoaded === 100) {
                // Stop observing, the scene is loaded
                observer.disconnect();

                addLoadingTransitionAnimationScript();
                // When the scene is loaded, fade the loading bar out and display the scene.
                /*loadingUI.classList.add("invisible");
                setTimeout(() => {
                    loadingUI.classList.add("hidden");
                    //sunsetUI.classList.remove("invisible");
                    //mapUI.classList.remove("invisible");
                }, 2000);*/
            }
        }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(shipWheel, config);
});

function addLoadingTransitionAnimationScript() {
    let body = document.getElementsByTagName("body")[0];
    let script = document.createElement("script");
    script.setAttribute("src", "./loadingTransitionAnimations.js");
    body.append(script);
}