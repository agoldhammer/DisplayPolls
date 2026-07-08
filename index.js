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
};

function captionFor(name) {
  return CAPTIONS[name] || name;
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

  if (names.length === 0) {
    status.textContent = "No .png files found in " + POLLS_DIR;
    return;
  }

  const frenchNames = names.filter(name => /^france/i.test(name));
  const germanNames = names.filter(name => /^german/i.test(name));

  renderGroup(frenchList, frenchNames);
  renderGroup(germanList, germanNames);
}

loadPolls();
