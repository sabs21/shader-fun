// The animations which play between the loading UI and the sunsetUI or mapUI

//document.addEventListener("DOMContentLoaded", () => {
    const loadingUI = document.getElementById("loadingUI");
    const shipWheelElem = document.getElementById('shipWheel');
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
    }, 600);

    for (let i = 0; i < navButtons.length; i++) {
        window.setTimeout(() => {
            // Play this animation on hover
            navButtons[i].addEventListener("mouseenter", () => {
                attentionAuras[i].style = auraAnimationStyle;
            });
            navButtons[i].addEventListener("mouseleave", () => {
                attentionAuras[i].style = "";
            });

            // Play these animations on load
            skeletonButtons[i].style = buttonAnimationStyle;
            skeletonAuras[i].style = skeletonAuraAnimationStyle;
        }, delay * i);
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
            console.log("elapsed/animationDuration", elapsed/animationDuration);
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

    // Animate the thin inner border.
    /*let innerStart, innerPreviousTimeStamp;
    function animateInner(timestamp) {
        
        if (innerStart === undefined) {
            innerStart = timestamp;
        }
        const elapsed = timestamp - innerStart;

        if (outerPreviousTimeStamp !== timestamp) {
            // Math.min() is used here to make sure the element stops at exactly 200px
            //let count = Math.min((-0.1 * elapsed)/360, -1);
            //element.style.transform = 'translateX(' + count + 'px)';
            drawProgress(innerDraw, elapsed/animationDuration);
            console.log("elapsed/animationDuration", elapsed/animationDuration);
        }

        if (elapsed < animationDuration) { // Stop the animation after 1.5 seconds
            innerPreviousTimeStamp = timestamp;
            window.requestAnimationFrame(animateInner);
        }
    }
    window.requestAnimationFrame(animateInner);*/

    function drawProgress(draw, progress) {
        let startingAngle = 270;
        draw.beginPath();
        draw.lineWidth = 800;
        //draw.lineCap = "round";
        draw.strokeStyle = "#ff0000";
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
//});