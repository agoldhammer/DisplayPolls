// Chart images have no embedded caption we can read in the browser, so the
// caption for each known file is taken from that chart's actual title, as
// set in the generating script (frelec/visualize_polls.py, GerElec/main.py).
// Loaded by both index.html (the listing) and chart.html (the viewer).
const CAPTIONS = {
  "france-first_round.png": "Présidentielle 2027 — intentions de vote, 1er tour",
  "france-first_round_recent.png": "Présidentielle 2027 — 1er tour, tendance récente",
  "france-first_round_pollsters.png": "Présidentielle 2027 — 1er tour, sondages par institut",
  "france-second_round_trend.png": "Présidentielle 2027 — second tour, hypothèses face au RN",
  "france-second_round_snapshot.png": "Présidentielle 2027 — second tour, dernier sondage par hypothèse",
  "german_polls_bundestag.png": "Sonntagsfrage: Wenn am Sonntag Bundestagswahl wäre …",
  "german_polls_recent.png": "Sonntagsfrage seit der Bundestagswahl 2025",
  "german_polls_coalitions.png": "Mögliche Koalitionen: rechnerische Mehrheiten",
  "german_polls_institutes.png": "Aktuelle Umfragen nach Institut",
  "german_polls_coalition_trends.png": "Koalitionen im Trend seit der Bundestagswahl 2025",
  "german_polls_institute_trends.png": "Parteien im Trend nach Institut",
  "italian_polls.png": "Sondaggi elettorali italiani: intenzioni di voto",
  "italian_polls_recent.png": "Sondaggi elettorali italiani: ultimi 12 mesi",
  "italian_polls_institutes.png": "Sondaggi recenti per istituto",
  "uk_polls_national.png": "Westminster voting intention since the 2024 general election",
  "uk_polls_recent.png": "Westminster voting intention, last 6 months",
  "uk_polls_pollsters.png": "Current polls by pollster",
  "uk_polls_pollster_trends.png": "Party support in trend by pollster",
};

function captionFor(name) {
  return CAPTIONS[name] || name;
}
