const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const layout = read("_layouts/default.html");
const config = read("_config.yml");

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
  assert.match(config, /user_title:\s*Software Engineer in Test II/);
  assert.match(config, /description:.*quality engineering.*automation.*release engineering/i);
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
