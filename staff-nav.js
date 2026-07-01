// Staff header dropdown helper.
// The <details class="pos-menu"> element toggles open/closed on its <summary>
// natively; this just closes an open menu when the user clicks outside it or
// presses Escape (the behaviour <details> doesn't give us for free).
(function () {
  function closeAll(except) {
    document.querySelectorAll("details.pos-menu[open]").forEach(function (menu) {
      if (menu !== except) menu.removeAttribute("open");
    });
  }

  document.addEventListener("click", function (e) {
    var inside = e.target.closest ? e.target.closest("details.pos-menu[open]") : null;
    closeAll(inside);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll(null);
  });
})();
