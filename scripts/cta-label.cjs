/**
 * Booking button label, applied to every static page at build time.
 *
 * The static pages in public/ still carry the old "Book a discovery call" wording in the
 * snapshot. This rewrites the built copies so the label is set in one place (LABEL below).
 * It only touches links that point at /book-a-free-discovery-call and whose text starts
 * with "Book a discovery call" or "Book a free discovery call"; inline sentence links,
 * headings and URLs are left alone.
 *
 * Booking links are plain links to the booking page (Sally, 21 Nov 2026), so no class is
 * added. The main.js and styles.css version stamps are bumped here too, so browsers fetch
 * the current files.
 *
 * Keep the length in LABEL in step with the Vexur booking calendar (currently 15 minutes).
 *
 * Called at the end of scripts/materialise-canonical-pages.js (prebuild), after the
 * canonical copies are written, so those copies are relabelled too.
 */
const fs = require('node:fs');
const path = require('node:path');

const LABEL = 'Book a FREE 15min consult';
const MODAL_LABEL = 'Book a free 15 minute consult';
const MAIN_JS_VERSION = '2026112102';

const OLD = /^(\s*)Book a (?:[Ff]ree )?[Dd]iscovery [Cc]all/;
const ANCHOR = /(<a\b[^>]*>)([\s\S]*?)(<\/a>)/gi;

function relabel(html) {
  return html
    .replace(ANCHOR, (match, open, inner, close) => {
      if (!/href=["']\/book-a-free-discovery-call/i.test(open)) return match;
      if (!OLD.test(inner)) return match;
      return open + inner.replace(OLD, '$1' + LABEL) + close;
    })
    .replace(/main\.js\?v=\d+/g, 'main.js?v=' + MAIN_JS_VERSION)
    .replace(/styles\.css\?v=\d+/g, 'styles.css?v=' + MAIN_JS_VERSION);
}

function walk(directory) {
  let count = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) count += walk(file);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const before = fs.readFileSync(file, 'utf8');
      const after = relabel(before);
      if (after !== before) { fs.writeFileSync(file, after); count++; }
    }
  }
  return count;
}

function patchMainJs(publicDir) {
  const file = path.join(publicDir, 'js', 'main.js');
  if (!fs.existsSync(file)) return false;
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace('"aria-label", "Book a discovery call"', '"aria-label", "' + MODAL_LABEL + '"');
  if (after !== before) fs.writeFileSync(file, after);
  return after !== before;
}

function run() {
  const publicDir = path.resolve(__dirname, '../public');
  console.log('booking button relabelled: ' + walk(publicDir) + ' HTML pages');
  console.log('booking modal label updated: ' + patchMainJs(publicDir));
}

if (require.main === module) run();

module.exports = { relabel, run, LABEL };
