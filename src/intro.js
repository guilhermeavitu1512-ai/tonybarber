// Opening film: embers rise, the scissors cut the screen and the two halves open on the site.
(function () {
  if (location.pathname !== "/" || location.hash) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var DONE_AT = 5000;
  var style = document.createElement("style");
  style.textContent = [
    "#tony-intro{position:fixed;z-index:9999;inset:0;overflow:hidden;color:#fff;font-family:system-ui,sans-serif}",
    "#tony-intro .half{position:absolute;left:0;right:0;height:50.2%;background:#0a0a0a;transition:transform 1000ms cubic-bezier(.75,0,.2,1)}",
    "#tony-intro .top{top:0}#tony-intro .bottom{bottom:0}",
    "#tony-intro[data-open] .top{transform:translateY(-101%)}#tony-intro[data-open] .bottom{transform:translateY(101%)}",
    "#tony-intro canvas{position:absolute;inset:0;width:100%;height:100%;transition:opacity 500ms}",
    "#tony-intro[data-open] canvas,#tony-intro[data-open] .skip,#tony-intro[data-open] .titles,#tony-intro[data-open] .cut{opacity:0}",
    "#tony-intro .titles{position:absolute;inset:0;transition:opacity 300ms ease-out}",
    "#tony-intro .cut{position:absolute;top:50%;left:0;width:100%;height:3px;margin-top:-1px;background:linear-gradient(90deg,#f97316,#ffd9a8);box-shadow:0 0 22px 4px rgba(249,115,22,.7);transform:scaleX(0);transform-origin:left;animation:tony-cut 1900ms cubic-bezier(.45,0,.55,1) 600ms forwards;transition:opacity 300ms}",
    "@keyframes tony-cut{to{transform:scaleX(1)}}",
    "#tony-intro .scissors{position:absolute;top:50%;left:0;width:min(170px,34vw);margin-top:calc(min(170px,34vw) * -.5);opacity:0;animation:tony-travel 1900ms cubic-bezier(.45,0,.55,1) 600ms forwards}",
    "@keyframes tony-travel{0%{opacity:1;transform:translateX(-30%)}92%{opacity:1}100%{opacity:0;transform:translateX(calc(100vw - 60%))}}",
    "#tony-intro .blade-a,#tony-intro .blade-b{transform-origin:100px 100px;animation:tony-snip-a 420ms ease-in-out 600ms 5}",
    "#tony-intro .blade-b{animation-name:tony-snip-b}",
    "@keyframes tony-snip-a{50%{transform:rotate(16deg)}}@keyframes tony-snip-b{50%{transform:rotate(-16deg)}}",
    "#tony-intro .word{position:absolute;right:0;bottom:calc(50% + 16px);left:0;margin:0;display:flex;justify-content:center;font-size:clamp(64px,17vw,170px);font-weight:900;line-height:1}",
    "#tony-intro .word span{display:block;overflow:hidden;padding:0 .02em}#tony-intro .word i{display:block;font-style:normal;transform:translateY(105%);animation:tony-rise 700ms cubic-bezier(.2,.9,.2,1) forwards}",
    "@keyframes tony-rise{to{transform:none}}",
    "#tony-intro .tag{position:absolute;top:calc(50% + 18px);right:0;left:0;margin:0;color:#f97316;font-size:clamp(17px,2.6vw,24px);font-weight:700;text-align:center;letter-spacing:.04em;opacity:0;animation:tony-fade 800ms ease-out 3000ms forwards}",
    "@keyframes tony-fade{to{opacity:1}}",
    "#tony-intro .skip{position:absolute;right:14px;bottom:14px;min-height:44px;padding:0 16px;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(255,255,255,.06);color:#ddd;font:600 13px system-ui,sans-serif;cursor:pointer;transition:opacity 300ms}",
  ].join("");
  document.head.appendChild(style);

  var root = document.createElement("div");
  root.id = "tony-intro";
  root.setAttribute("role", "img");
  root.setAttribute("aria-label", "Abertura da Barbearia Tony: uma tesoura corta a tela e o site aparece.");
  var letters = "TONY".split("").map(function (letter, index) {
    return '<span><i style="animation-delay:' + (2500 + index * 90) + 'ms">' + letter + "</i></span>";
  }).join("");
  root.innerHTML =
    '<div class="half top"></div><div class="half bottom"></div><canvas></canvas><div class="cut"></div>' +
    '<svg class="scissors" viewBox="0 0 200 200" aria-hidden="true" fill="none" stroke="#f4f4f5" stroke-width="7" stroke-linecap="round">' +
    '<g class="blade-a"><path d="M100 100 L188 72" stroke-width="11"/><circle cx="46" cy="130" r="22"/><path d="M100 100 L64 118"/></g>' +
    '<g class="blade-b"><path d="M100 100 L188 128" stroke-width="11"/><circle cx="46" cy="70" r="22"/><path d="M100 100 L64 82"/></g>' +
    '<circle cx="100" cy="100" r="7" fill="#f97316" stroke="none"/></svg>' +
    '<div class="titles"><p class="word" aria-hidden="true">' + letters + '</p><p class="tag">Original como você.</p></div>' +
    '<button class="skip" type="button">Pular intro</button>';
  document.documentElement.style.overflow = "hidden";

  var canvas = root.querySelector("canvas");
  var context = canvas.getContext("2d");
  var width = (canvas.width = innerWidth);
  var height = (canvas.height = innerHeight);
  var embers = [];
  for (var count = 0; count < (width < 760 ? 60 : 130); count++) embers.push({ x: Math.random() * width, y: Math.random() * height, size: 0.8 + Math.random() * 2, speed: 0.3 + Math.random() * 1.1, sway: Math.random() * 6 });
  var frame;
  function paint(time) {
    context.clearRect(0, 0, width, height);
    embers.forEach(function (ember) {
      ember.y -= ember.speed;
      if (ember.y < -8) ember.y = height + 8;
      context.fillStyle = "rgba(249," + (100 + Math.round(ember.sway * 16)) + ",22," + (0.35 + ember.size / 5) + ")";
      context.beginPath();
      context.arc(ember.x + Math.sin(time / 700 + ember.sway) * 12, ember.y, ember.size, 0, 7);
      context.fill();
    });
    frame = requestAnimationFrame(paint);
  }
  frame = requestAnimationFrame(paint);

  var timers = [];
  function finish() {
    timers.forEach(clearTimeout);
    cancelAnimationFrame(frame);
    document.documentElement.style.overflow = "";
    root.remove();
    style.remove();
  }
  root.querySelector(".skip").addEventListener("click", finish);
  addEventListener("keydown", function onKey(event) { if (event.key === "Escape") { removeEventListener("keydown", onKey); finish(); } });
  timers.push(setTimeout(function () { root.setAttribute("data-open", ""); }, DONE_AT - 1050));
  timers.push(setTimeout(finish, DONE_AT));

  document.body ? document.body.appendChild(root) : document.documentElement.appendChild(root);
})();
