document.addEventListener("DOMContentLoaded", () => {
    const topTag      = document.getElementById("top-tag");
    const bottomTag   = document.getElementById("bottom-tag");
    const titleBlock  = document.getElementById("main-title-block");
    const stripScene  = document.getElementById("race-strip-scene");
    const ghostPaths  = document.getElementById("ghost-paths");
    const loadingText = document.getElementById("loading-text");
    const entryBtn    = document.getElementById("entry-btn");
    const heroCar     = document.getElementById("hero-red-car");
    const wake        = document.getElementById("speed-wake");

    setTimeout(() => {
        topTag.classList.remove("opacity-0");
        bottomTag.classList.remove("opacity-0");
        titleBlock.classList.remove("opacity-0");
        titleBlock.classList.remove("translate-y-4");
    }, 800);

    setTimeout(() => {
        stripScene.classList.remove("opacity-0");
        loadingText.innerText = "CALIBRATING TELEMETRY ARRAYS...";
    }, 1800);

    setTimeout(() => {
        heroCar.classList.remove("opacity-0");
        heroCar.classList.remove("transform", "-translate-x-12");

        setInterval(() => {
            const dynamicPace = 45 + (Math.random() * 6);
            heroCar.style.left = dynamicPace + "%";
            if (Math.random() > 0.5) {
                wake.style.width = "140px";
                wake.style.opacity = "0.7";
            } else {
                wake.style.width = "90px";
                wake.style.opacity = "0.4";
            }
        }, 1800);
    }, 2800);

    setTimeout(() => {
        ghostPaths.classList.remove("opacity-0");
        loadingText.innerText = "ML PREDICTION ENGINE ONLINE";
    }, 3800);

    setTimeout(() => {
        loadingText.innerText = "ALL SYSTEMS GO";
        entryBtn.classList.remove("opacity-0");
        entryBtn.classList.remove("scale-95");
        entryBtn.classList.add("pointer-events-auto");
    }, 4800);
});

function dismissSplash() {
    const splash = document.getElementById("apex-1-splash");
    splash.style.opacity = "0";
    setTimeout(() => splash.remove(), 1000);
}