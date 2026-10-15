// Wolfsblvt Works sponsor section: play the motion once when the section first comes into view.
// Without JS, with reduced motion, or without IntersectionObserver, the section simply shows its finished state.
(() => {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-playing'); io.unobserve(e.target); }
  }), { threshold: 0.35 });
  document.querySelectorAll('.works-sponsor').forEach((el) => { el.classList.add('will-play'); io.observe(el); });
})();
