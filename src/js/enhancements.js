const getChicagoPhase = (hour) => {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "dusk";
  return "night";
};

const getChicagoHour = (date = new Date()) => Number(
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: "America/Chicago",
  }).format(date),
);

const copyEmail = async (email, clipboard = navigator.clipboard) => {
  await clipboard.writeText(email);
};

const createWordmarkCounter = (onPass, target = 5) => {
  let clicks = 0;

  return () => {
    clicks += 1;
    if (clicks < target) return;
    clicks = 0;
    onPass();
  };
};

const initEnhancements = () => {
  const hero = document.querySelector(".hero");
  const toast = document.querySelector(".copy-toast");
  let toastTimer;

  const showToast = (message) => {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };

  const syncChicagoPhase = () => {
    if (hero) hero.dataset.skylinePhase = getChicagoPhase(getChicagoHour());
  };

  syncChicagoPhase();
  window.setInterval(syncChicagoPhase, 15 * 60 * 1000);

  const allowsMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (allowsMotion && hasFinePointer) {
    document.querySelectorAll("[data-magnetic]").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - (bounds.left + bounds.width / 2)) * 0.12;
        const y = (event.clientY - (bounds.top + bounds.height / 2)) * 0.12;
        element.style.setProperty("--magnetic-x", `${x.toFixed(1)}px`);
        element.style.setProperty("--magnetic-y", `${y.toFixed(1)}px`);
      });

      element.addEventListener("pointerleave", () => {
        element.style.setProperty("--magnetic-x", "0px");
        element.style.setProperty("--magnetic-y", "0px");
      });
    });
  }

  const emailLink = document.querySelector("[data-copy-email]");
  if (emailLink) {
    emailLink.addEventListener("click", () => {
      copyEmail(emailLink.dataset.copyEmail)
        .then(() => showToast("Email copied — let’s talk"))
        .catch(() => {});
    });
  }

  const wordmark = document.querySelector("[data-wordmark-egg]");
  if (wordmark) {
    const countWordmarkClick = createWordmarkCounter(() => {
      wordmark.classList.add("is-passing");
      showToast("expect(quality).toPass() ✓");
      window.setTimeout(() => wordmark.classList.remove("is-passing"), 1800);
    });
    wordmark.addEventListener("click", countWordmarkClick);
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { copyEmail, createWordmarkCounter, getChicagoPhase, getChicagoHour };
}

if (typeof document !== "undefined") {
  initEnhancements();
}
