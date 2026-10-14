(function () {
  // WordPress rewrites angle brackets and double ampersands inside inline scripts, so this file uses none.
  var s = document.getElementById("pl-top");
  if (!s) return;
  var mq = function (q) { return window.matchMedia ? window.matchMedia(q).matches : false; };
  var clamp = function (n, lo, hi) { return Math.max(lo, Math.min(hi, n)); };
  var reduced = mq("(prefers-reduced-motion: reduce)");
  var fine = mq("(pointer: fine)");
  // entrance: hide, then reveal once the webfonts are in (never wait longer than 1.5s)
  s.classList.add("pl-js");
  var shown = false;
  var show = function () { if (!shown) { shown = true; s.classList.add("pl-ready"); } };
  if (document.fonts ? document.fonts.ready : false) document.fonts.ready.then(show); else show();
  setTimeout(show, 1500);

  var v = s.querySelector(".pl-visual");
  if (!v) return;
  var trigger = v.querySelector(".pl-trigger");
  var text = v.querySelector(".pl-trigger__text");
  var pause = v.querySelector(".pl-pause");
  var status = v.querySelector(".pl-sr");
  var idle = fine ? "Click to explore" : "Tap to explore";
  var paused = false, scanning = false, timer = 0;
  text.textContent = idle;
  if (reduced) { v.setAttribute("data-paused", "true"); pause.hidden = true; }

  trigger.addEventListener("click", function () {
    if (scanning) return;
    scanning = true;
    v.setAttribute("data-scanning", "true");
    trigger.disabled = true;
    text.textContent = "Exploring the signal";
    status.textContent = "Playing an illustrative identity scan.";
    clearTimeout(timer);
    timer = setTimeout(function () {
      scanning = false;
      v.setAttribute("data-scanning", "false");
      trigger.disabled = false;
      text.textContent = idle;
      status.textContent = "";
    }, reduced || paused ? 900 : 3400);
  });

  pause.addEventListener("click", function () {
    paused = !paused;
    v.setAttribute("data-paused", String(paused || reduced));
    pause.setAttribute("aria-pressed", String(paused));
    if (paused) reset();
  });

  // pointer depth + light, fine pointers only; stops when hidden or scrolled away
  var visible = true, frame = 0, x = 0, y = 0, tx = 0, ty = 0;
  function reset() {
    tx = ty = x = y = 0;
    v.style.setProperty("--depth-x", "0"); v.style.setProperty("--depth-y", "0");
    v.style.setProperty("--light-x", "65%"); v.style.setProperty("--light-y", "42%");
  }
  function render() {
    frame = 0;
    if (!visible || document.hidden || paused) return;
    x += (tx - x) * 0.065; y += (ty - y) * 0.065;
    v.style.setProperty("--depth-x", x.toFixed(4)); v.style.setProperty("--depth-y", y.toFixed(4));
    var remaining = Math.abs(tx - x) + Math.abs(ty - y);
    if (Math.max(remaining, 0.001) !== 0.001) frame = requestAnimationFrame(render);
  }
  function queue() { if (!(frame || !visible || document.hidden || paused)) frame = requestAnimationFrame(render); }
  function active() {
    v.setAttribute("data-active", String(!(!visible || document.hidden)));
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else queue();
  }
  if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; active(); }).observe(v);
  document.addEventListener("visibilitychange", active);
  if (reduced || !fine) return;
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch" || paused) return;
    var b = v.getBoundingClientRect();
    var nx = (e.clientX - b.left) / b.width, ny = (e.clientY - b.top) / b.height;
    var inside = nx === clamp(nx, 0, 1) ? ny === clamp(ny, 0, 1) : false;
    v.setAttribute("data-hover", String(inside));
    tx = clamp(nx * 2 - 1, -1, 1); ty = clamp(ny * 2 - 1, -1, 1);
    v.style.setProperty("--light-x", clamp(nx, 0, 1) * 100 + "%");
    v.style.setProperty("--light-y", clamp(ny, 0, 1) * 100 + "%");
    queue();
  }, { passive: true });
  document.addEventListener("pointerleave", function () { tx = 0; ty = 0; v.setAttribute("data-hover", "false"); queue(); });
})();
