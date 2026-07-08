const POLLS_DIR = "/polls/";

// Chart images have no embedded caption we can read in the browser, so the
// caption for each known file is taken from that chart's actual title, as
// set in the generating script (frelec/visualize_polls.py, GerElec/main.py).
const CAPTIONS = {
  "France-latest.png": "Présidentielle 2027 — intentions de vote, 1er tour",
  "german_polls_bundestag.png": "Sonntagsfrage: Wenn am Sonntag Bundestagswahl wäre …",
  "german_polls_recent.png": "Sonntagsfrage seit der Bundestagswahl 2025",
  "german_polls_coalitions.png": "Mögliche Koalitionen: rechnerische Mehrheiten",
  "german_polls_institutes.png": "Aktuelle Umfragen nach Institut",
  "german_polls_coalition_trends.png": "Koalitionen im Trend seit der Bundestagswahl 2025",
  "german_polls_institute_trends.png": "Parteien im Trend nach Institut",
  "italian_polls.png": "Sondaggi elettorali italiani: intenzioni di voto",
  "italian_polls_recent.png": "Sondaggi elettorali italiani: ultimi 12 mesi",
  "italian_polls_institutes.png": "Sondaggi recenti per istituto",
};

function captionFor(name) {
  return CAPTIONS[name] || name;
}

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

// nginx's autoindex plain listing puts "DD-Mon-YYYY HH:MM" after each <a> tag
// as sibling text, not an attribute, so this scans the raw HTML rather than
// the parsed DOM.
function latestModifiedDate(html) {
  const re = /<a href="[^"]+\.png">[^<]*<\/a>\s+(\d{2})-(\w{3})-(\d{4})\s+(\d{2}):(\d{2})/g;
  let latest = null;
  let match;
  while ((match = re.exec(html)) !== null) {
    const [, day, mon, year, hour, min] = match;
    const date = new Date(+year, MONTHS[mon], +day, +hour, +min);
    if (!latest || date > latest) latest = date;
  }
  return latest;
}

function renderGroup(list, names) {
  for (const name of names) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = POLLS_DIR + name;

    const img = document.createElement("img");
    img.src = POLLS_DIR + name;
    img.alt = captionFor(name);
    img.loading = "lazy";

    const span = document.createElement("span");
    span.textContent = captionFor(name);

    a.appendChild(img);
    a.appendChild(span);
    li.appendChild(a);
    list.appendChild(li);
  }
}

async function loadPolls() {
  const frenchList = document.getElementById("french-poll-list");
  const germanList = document.getElementById("german-poll-list");
  const italianList = document.getElementById("italian-poll-list");
  const status = document.getElementById("status");

  let response;
  try {
    response = await fetch(POLLS_DIR);
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

  const lastUpdated = latestModifiedDate(html);
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

  renderGroup(frenchList, frenchNames);
  renderGroup(germanList, germanNames);
  renderGroup(italianList, italianNames);
}

loadPolls();
