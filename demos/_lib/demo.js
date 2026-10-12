/* Demo de Magnvex: los botones de contacto de esta demo no llevan a datos reales. */
(function () {
  var toast = document.createElement('div');
  toast.className = 'mgx-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  var timer;
  function show(msg) {
    if (!toast.parentNode) document.body.appendChild(toast);
    toast.innerHTML = '<b>Demo de Magnvex.</b> ' + msg;
    toast.classList.add('on');
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove('on'); }, 3400);
  }
  var DEFAULT = 'En la web real, este botón abre el teléfono, el WhatsApp o las redes del restaurante.';
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-demo]') : null;
    if (!el || el.tagName === 'FORM') return;
    e.preventDefault();
    show(el.getAttribute('data-demo') || DEFAULT);
  });
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f.hasAttribute || !f.hasAttribute('data-demo')) return;
    e.preventDefault();
    show(f.getAttribute('data-demo') || 'En la web real, la reserva llega al momento al WhatsApp o al email del restaurante.');
  });
})();
