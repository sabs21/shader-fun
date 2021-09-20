// The animations which play between the loading UI and the sunsetUI or mapUI

const loadingUI = document.getElementById("loadingUI");
const shipWheelElem = document.getElementById('shipWheel');
const welcomeTextElems = document.getElementsByClassName("welcomeText");
const skeletonAuraAnimationStyle = "animation: 500ms ease-in 1 normal running skeletonButtonPresence; animation-fill-mode: backwards;";
const auraAnimationStyle = "animation: 500ms ease-in 1 normal running buttonPresence; animation-fill-mode: backwards;";
const buttonAnimationStyle = "animation: 500ms ease-in 1 normal running bouncy; animation-fill-mode: forwards;";
const delay = 750;

// Use canvas to achieve the border drawing effect.
let outerCanvas = document.getElementById('loadingOuterFrameBackingCanvas');
let outerDraw = outerCanvas.getContext('2d');
let innerCanvas = document.getElementById('loadingInnerFrameBackingCanvas');
let innerDraw = innerCanvas.getContext('2d');

let outerCanvasRect = outerCanvas.getBoundingClientRect();
// Ensure the size of the outer canvas matches the CSS size
outerCanvas.width = outerCanvasRect.width;
outerCanvas.height = outerCanvasRect.height;
// Move the origin point to the center
outerDraw.save();
outerDraw.translate(outerCanvasRect.width/2, outerCanvasRect.height/2);
let innerCanvasRect = innerCanvas.getBoundingClientRect();
// Ensure the size of the inner canvas matches the CSS size
innerCanvas.width = innerCanvasRect.width;
innerCanvas.height = innerCanvasRect.height;
// Move the origin point to the center
innerDraw.save();
innerDraw.translate(innerCanvasRect.width/2, innerCanvasRect.height/2);
//console.log(outerCanvasRect);

let skeletonButtons = document.getElementsByClassName("skeletonButton"); // The placeholder buttons shown in the loading UI
let skeletonAuras = document.getElementsByClassName("skeletonAura"); // The placeholder buttons shown in the loading UI
let navButtons = document.getElementsByClassName("navButton");
let attentionAuras = document.getElementsByClassName("attentionAura");

// Fade the ship wheel out
shipWheelElem.classList.add("invisible");
setTimeout(() => {
    shipWheelElem.classList.add("hidden");
    shipWheelElem.style = "animation: none;"; // Stop the animation so that it's not running in the background.
    // Now that the ship wheel is fully hidden, fade in the welcome text.
    for (let text of welcomeTextElems) {
        text.classList.add("active");
    }
    setTimeout(() => {
        // Fade the welcome text out.
        for (let text of welcomeTextElems) {
            text.classList.remove("active");
        }
    }, 3000);
}, 600);

// Play the buttonPresence animation on the skeleton buttons on load.
for (let i = 0; i < skeletonButtons.length; i++) {
    window.setTimeout(() => {
        // Play these skeleton animations on load
        skeletonButtons[i].style = buttonAnimationStyle;
        skeletonAuras[i].style = skeletonAuraAnimationStyle;
    }, delay * i);
}

// Play the buttonPresence animation just once on each navButton hover. 
for (let i = 0; i < navButtons.length; i++) {
    navButtons[i].addEventListener("mouseenter", () => {
        attentionAuras[i].style = auraAnimationStyle;
    });
    navButtons[i].addEventListener("mouseleave", () => {
        attentionAuras[i].style = "";
    });
}

// Duration of both inner and outer animations
let animationDuration = 2000;

// Animate the thick outer border.
let start, previousTimeStamp;
function animateBorders(timestamp) {
    if (start === undefined) {
        start = timestamp;
    }
    const elapsed = timestamp - start;

    if (previousTimeStamp !== timestamp) {
        drawProgress(outerDraw, elapsed/animationDuration);
        drawProgress(innerDraw, elapsed/animationDuration);
    }

    if (elapsed < animationDuration) { // Stop the animation after 1.5 seconds
        previousTimeStamp = timestamp;
        window.requestAnimationFrame(animateBorders);
    }
    else {
        loadingUI.classList.add("invisible");
        setTimeout(() => {
            loadingUI.classList.add("hidden");
        }, 1000);
    }
}
window.requestAnimationFrame(animateBorders);

function drawProgress(draw, progress) {
    let startingAngle = 270;
    draw.beginPath();
    draw.lineWidth = 800;
    //draw.lineCap = "round";
    draw.strokeStyle = "#ffffff";
    draw.arc(0, 
            0, 
            500, 
            degToRad(startingAngle), 
            degToRad(startingAngle + progress*360), 
            false);
    draw.stroke();
    draw.closePath();
}

function degToRad(deg)
{
    return deg * (Math.PI/180);
}