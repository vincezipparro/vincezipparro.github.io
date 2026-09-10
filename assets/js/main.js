const updateScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  document.body.style.setProperty("--scroll-progress", `${progress}%`);
};

const MARQUEE_PIXELS_PER_SECOND = 30;
const marqueeTrack = document.querySelector(".marquee-track");
let marqueeCopiesPerHalf = 0;

const sizeMarquee = () => {
  const template = marqueeTrack && marqueeTrack.firstElementChild;
  const groupWidth = template ? template.getBoundingClientRect().width : 0;
  if (!groupWidth) return;

  // Each half of the track has to span at least a viewport, or the end of the
  // loop drags empty background across the screen before it repeats.
  const copiesPerHalf = Math.max(1, Math.ceil(window.innerWidth / groupWidth));

  if (copiesPerHalf !== marqueeCopiesPerHalf) {
    marqueeCopiesPerHalf = copiesPerHalf;

    while (marqueeTrack.children.length > 1) {
      marqueeTrack.lastElementChild.remove();
    }

    for (let copy = 1; copy < copiesPerHalf * 2; copy += 1) {
      const clone = template.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      marqueeTrack.append(clone);
    }
  }

  marqueeTrack.style.setProperty(
    "--marquee-duration",
    `${(copiesPerHalf * groupWidth) / MARQUEE_PIXELS_PER_SECOND}s`,
  );
};

let marqueeResizeTimer;
const queueMarqueeSizing = () => {
  clearTimeout(marqueeResizeTimer);
  marqueeResizeTimer = setTimeout(sizeMarquee, 150);
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const header = document.querySelector("[data-site-header]");
const hero = document.querySelector(".hero");
const navLinks = [...document.querySelectorAll('.site-header nav a[href^="#"]')];
const observedSections = navLinks
  .map((link) => document.querySelector(link.hash))
  .filter(Boolean);

// Separate enter and exit points, so scrolling around the hero boundary can't
// flip the header back and forth on every stray pixel.
const syncHeader = () => {
  if (!header || !hero) return;

  const enterAt = hero.offsetHeight - 72;
  const isScrolled = header.classList.contains("is-scrolled");

  if (!isScrolled && window.scrollY > enterAt) {
    header.classList.add("is-scrolled");
  } else if (isScrolled && window.scrollY < enterAt - 90) {
    header.classList.remove("is-scrolled");
  }
};

const syncActiveNav = () => {
  if (!navLinks.length) return;

  if (hero && window.scrollY < hero.offsetHeight - 96) {
    navLinks.forEach((link) => link.classList.remove("is-active"));
    return;
  }

  const marker = window.scrollY + window.innerHeight * 0.32;
  let current = observedSections[0];

  for (const section of observedSections) {
    if (section.offsetTop <= marker) current = section;
  }

  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
    current = observedSections[observedSections.length - 1];
  }

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", current && link.hash === `#${current.id}`);
  });
};

let scrollFrame = 0;
const onScroll = () => {
  if (scrollFrame) return;

  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    updateScrollProgress();
    syncHeader();
    syncActiveNav();
  });
};

const revealTargets = document.querySelectorAll([
  ".about-copy",
  ".principle-card",
  ".section-heading",
  ".timeline-item",
  ".project-card",
  ".capability-grid article",
  ".toolbelt",
  ".contact-section h2",
  ".contact-row",
].join(", "));

const reveal = () => {
  revealTargets.forEach((el, index) => {
    el.classList.add("reveal");
    el.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 80}ms`);
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });

  revealTargets.forEach((el) => observer.observe(el));
};

const animateCount = (el) => {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target)) return;

  const duration = 1100;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = `${Math.round(target * eased)}+`;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

const watchCount = () => {
  const number = document.querySelector("[data-count]");
  if (!number) return;
  if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      animateCount(number);
      observer.disconnect();
    }
  }, { threshold: 0.35 });

  observer.observe(number);
};

const watchHeroParallax = () => {
  if (!hero || prefersReducedMotion) return;

  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    hero.style.setProperty("--hero-x", `${(x * 22).toFixed(1)}px`);
    hero.style.setProperty("--hero-y", `${(y * 16).toFixed(1)}px`);
  });

  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--hero-x", "0px");
    hero.style.setProperty("--hero-y", "0px");
  });
};

document.documentElement.classList.add("js");
document.querySelector("[data-year]").textContent = new Date().getFullYear();
updateScrollProgress();
syncHeader();
syncActiveNav();
sizeMarquee();
reveal();
watchCount();
watchHeroParallax();
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => {
  queueMarqueeSizing();
  syncHeader();
  syncActiveNav();
});

if (document.fonts) {
  document.fonts.ready.then(sizeMarquee);
}
