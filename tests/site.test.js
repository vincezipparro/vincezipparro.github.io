const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const layout = read("_layouts/default.html");
const config = read("_config.yml");
const styles = read("src/styles/main.scss");
const enhancementsPath = path.join(root, "src/js/enhancements.js");
const enhancements = fs.existsSync(enhancementsPath) ? require(enhancementsPath) : {};

test("page exposes accessible navigation and primary content landmarks", () => {
  assert.match(layout, /<a[^>]+class="skip-link"[^>]+href="#main-content"/);
  assert.match(layout, /<nav[^>]+aria-label="Primary navigation"/);
  assert.match(layout, /<main id="main-content"/);
});

test("portfolio includes the core storytelling sections", () => {
  for (const section of ["about", "experience", "work", "capabilities", "contact"]) {
    assert.match(layout, new RegExp(`<section[^>]+id="${section}"`));
  }
});

test("metadata reflects Vince's current professional focus", () => {
  assert.match(config, /user_title:\s*Software Engineer$/m);
  assert.match(config, /description:.*quality engineering.*automation.*release engineering/i);
});

test("experience timeline covers every employer in the career history", () => {
  for (const employer of [
    "Invoca",
    "Benchmark Analytics",
    "The Coda Collection",
    "DialogTech",
    "SA Ignite",
    "Coyote Logistics",
  ]) {
    assert.ok(layout.includes(employer), `timeline is missing ${employer}`);
  }
});

test("each timeline entry is dated and backed by detail bullets", () => {
  const entries = [...layout.matchAll(/<article class="timeline-item">([\s\S]*?)<\/article>/g)];
  assert.ok(entries.length >= 6, `expected at least 6 roles, found ${entries.length}`);

  for (const [, entry] of entries) {
    assert.match(entry, /<span>[A-Z][a-z]{2} \d{4} — (Present|[A-Z][a-z]{2} \d{4})<\/span>/);
    assert.match(entry, /<ul class="detail-list">[\s\S]*?<li>/);
  }
});

test("toolbelt lists the technologies used across those roles", () => {
  for (const tool of ["Cypress", "RSpec", "Rest Assured", "Appium", "Buildkite", "Datadog"]) {
    assert.ok(layout.includes(tool), `toolbelt is missing ${tool}`);
  }
});

test("current Invoca role covers Mosaic, Claude Code, and AI orchestration", () => {
  const invoca = layout.split('<article class="timeline-item">')[1];
  assert.match(invoca, /Mosaic/);
  assert.match(invoca, /consumed by other teams/);
  assert.match(invoca, /Claude Code/);
  assert.match(invoca, /AI orchestration/);
  assert.match(invoca, /framework development/i);
});

test("external links opened in a new tab are protected", () => {
  const files = [
    "_layouts/default.html",
    "_includes/footer.html",
  ];

  for (const file of files) {
    const unsafe = [...read(file).matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)]
      .filter(([tag]) => !/rel="[^"]*noopener[^"]*"/.test(tag));
    assert.equal(unsafe.length, 0, `${file} contains unsafe target="_blank" links`);
  }
});

test("skyline follows Chicago local time across four day phases", () => {
  assert.equal(typeof enhancements.getChicagoPhase, "function");

  if (enhancements.getChicagoPhase) {
    assert.equal(enhancements.getChicagoPhase(6), "dawn");
    assert.equal(enhancements.getChicagoPhase(12), "day");
    assert.equal(enhancements.getChicagoPhase(19), "dusk");
    assert.equal(enhancements.getChicagoPhase(23), "night");
  }

  for (const phase of ["dawn", "day", "dusk", "night"]) {
    assert.match(styles, new RegExp(`data-skyline-phase="${phase}"`));
  }
});

test("primary calls to action opt into restrained magnetic motion", () => {
  assert.match(layout, /class="circle-link"[^>]+data-magnetic/);
  assert.match(layout, /class="contact-button"[^>]+data-magnetic/);
  assert.match(styles, /--magnetic-x/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
});

test("contact action copies the email and announces feedback accessibly", async () => {
  assert.match(layout, /class="contact-button"[^>]+data-copy-email/);
  assert.match(layout, /class="copy-toast"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.equal(typeof enhancements.copyEmail, "function");

  if (enhancements.copyEmail) {
    let copied = "";
    await enhancements.copyEmail("vince@example.com", {
      writeText: async (value) => { copied = value; },
    });
    assert.equal(copied, "vince@example.com");
  }
});

test("site details include branded selection and a wordmark easter egg", () => {
  assert.match(styles, /::selection/);
  assert.match(layout, /class="wordmark"[^>]+data-wordmark-egg/);
  assert.equal(typeof enhancements.createWordmarkCounter, "function");

  if (enhancements.createWordmarkCounter) {
    let passes = 0;
    const countClick = enhancements.createWordmarkCounter(() => { passes += 1; });
    for (let click = 0; click < 4; click += 1) countClick();
    assert.equal(passes, 0);
    countClick();
    assert.equal(passes, 1);
    for (let click = 0; click < 5; click += 1) countClick();
    assert.equal(passes, 2);
  }
});
