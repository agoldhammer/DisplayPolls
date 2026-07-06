const POLLS_DIR = "/polls/";

async function loadPolls() {
  const list = document.getElementById("poll-list");
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

  for (const name of names) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = POLLS_DIR + name;

    const img = document.createElement("img");
    img.src = POLLS_DIR + name;
    img.alt = name;
    img.loading = "lazy";

    const span = document.createElement("span");
    span.textContent = name;

    a.appendChild(img);
    a.appendChild(span);
    li.appendChild(a);
    list.appendChild(li);
  }
}

loadPolls();
