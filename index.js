// CAPTIONS and captionFor() come from captions.js, which chart.js loads too.
const POLLS_DIR = "/polls/";

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

// nginx's autoindex plain listing puts "DD-Mon-YYYY HH:MM" after each <a> tag
// as sibling text, not an attribute, so this scans the raw HTML rather than
// the parsed DOM.
function modifiedDates(html) {
  const re = /<a href="([^"]+\.png)">[^<]*<\/a>\s+(\d{2})-(\w{3})-(\d{4})\s+(\d{2}):(\d{2})/g;
  const dates = new Map();
  let match;
  while ((match = re.exec(html)) !== null) {
    const [, href, day, mon, year, hour, min] = match;
    dates.set(decodeURIComponent(href), new Date(+year, MONTHS[mon], +day, +hour, +min));
  }
  return dates;
}

function renderGroup(list, names, dates) {
  for (const name of names) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    // Charts open in the viewer page, in this same tab: the viewer carries the
    // site header and a link back here, so nothing is lost by not opening a
    // second tab. The ?v= mtime changes whenever a chart is redeployed and is
    // passed through to the image, so a stale copy is never served from cache.
    const modified = dates.get(name);
    a.href = "chart.html?img=" + encodeURIComponent(name) +
      (modified ? "&v=" + modified.getTime() : "");
    a.textContent = captionFor(name);
    li.appendChild(a);
    list.appendChild(li);
  }
}

async function loadPolls() {
  const frenchList = document.getElementById("french-poll-list");
  const germanList = document.getElementById("german-poll-list");
  const italianList = document.getElementById("italian-poll-list");
  const ukList = document.getElementById("uk-poll-list");
  const status = document.getElementById("status");

  let response;
  try {
    response = await fetch(POLLS_DIR, { cache: "no-cache" });
  } catch (err) {
    status.textContent = "Could not reach " + POLLS_DIR + " (" + err.message + ")";
    return;
  }

  if (!response.ok) {
    status.textContent = "Directory listing request failed: HTTP " + response.status +
      ". Make sure 'autoindex on;' is set for the " + POLLS_DIR + " location in nginx.";
    return;
  }

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const names = Array.from(doc.querySelectorAll("a"))
    .map(a => decodeURIComponent(a.getAttribute("href")))
    .filter(href => href.toLowerCase().endsWith(".png"))
    .sort();

  const dates = modifiedDates(html);
  const lastUpdated = dates.size ? new Date(Math.max(...dates.values())) : null;
  if (lastUpdated) {
    document.getElementById("last-updated").textContent =
      "(last updated on " +
      lastUpdated.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) +
      ")";
  }

  if (names.length === 0) {
    status.textContent = "No .png files found in " + POLLS_DIR;
    return;
  }

  const frenchNames = names.filter(name => /^france/i.test(name));
  const germanNames = names.filter(name => /^german/i.test(name));
  const italianNames = names.filter(name => /^italian/i.test(name));
  const ukNames = names.filter(name => /^uk_polls/i.test(name));

  renderGroup(frenchList, frenchNames, dates);
  renderGroup(germanList, germanNames, dates);
  renderGroup(italianList, italianNames, dates);
  renderGroup(ukList, ukNames, dates);
}

loadPolls();
