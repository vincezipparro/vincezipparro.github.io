const updateScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  document.body.style.setProperty("--scroll-progress", `${progress}%`);
};

document.querySelector("[data-year]").textContent = new Date().getFullYear();
updateScrollProgress();
window.addEventListener("scroll", updateScrollProgress, { passive: true });
