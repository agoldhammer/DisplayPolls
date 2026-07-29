// Viewer for a single chart. The listing links here rather than straight to
// the PNG so the chart opens inside the site's header, with a way back to the
// index -- a bare image has neither.
//
//   chart.html?img=<png filename>[&v=<mtime>]
//
// The ?v= is passed straight through to the image request, so the viewer
// cache-busts exactly the way the old direct links did.

const POLLS_DIR = "/polls/";

// Only a plain PNG filename is accepted: anything with a slash, a scheme, or
// "..") in it would let a crafted link point the page at an arbitrary URL.
function chartName(raw) {
  if (!raw || !/^[\w.-]+\.png$/i.test(raw) || raw.includes("..")) return null;
  return raw;
}

function showChart() {
  const params = new URLSearchParams(location.search);
  const name = chartName(params.get("img"));
  const caption = document.getElementById("chart-caption");
  const image = document.getElementById("chart-image");
  const status = document.getElementById("status");

  if (!name) {
    image.remove();
    status.textContent = "No chart requested. Pick one from the index.";
    return;
  }

  const text = captionFor(name);
  caption.textContent = text;
  image.alt = text;
  document.title = text + " — Aggregated European Polls";

  const version = params.get("v");
  image.src = POLLS_DIR + encodeURIComponent(name) +
    (version && /^\d+$/.test(version) ? "?v=" + version : "");
  image.addEventListener("error", () => {
    image.remove();
    status.textContent = "Could not load " + POLLS_DIR + name + ".";
  });
}

showChart();
