// =============================================================================
// Investors — content for the /investors page and any surface that thanks
// backers. Kept as a plain JS array (not an API endpoint) because the list
// changes infrequently and shouldn't require a backend deploy to update. If
// the roster ever grows into "many rows / rich profiles", migrate to a DB
// table + admin CRUD; until then, editing this file is the update path.
//
// Each entry:
//   name         — display name (company or individual)
//   tier         — optional grouping label ("Founding", "Growth", "Angel", …)
//                  Investors are auto-grouped by tier on the page.
//   logo         — public URL or an imported asset path. Falls back to a
//                  monogram badge (first letter of `name`) when omitted.
//   website      — external URL, opens in a new tab
//   description  — 1–3 sentence blurb. Optional but recommended.
//   quote        — optional short pull-quote to add warmth
//   since        — year they came onboard (e.g. 2024). Shown as "Backing us since 2024"
// =============================================================================

const investors = [
  // -------------------------------------------------------------------------
  // TODO: Add real investors here.
  //
  // Example entry (leave commented until you have a real backer to feature):
  //
  // {
  //   name: "Example Ventures",
  //   tier: "Founding",
  //   logo: "https://example.com/logo.svg",
  //   website: "https://example.com",
  //   description:
  //     "Example Ventures partnered with INTERVOS from day one, backing our vision to modernise Quebec's construction procurement.",
  //   quote:
  //     "INTERVOS is exactly the kind of infrastructure the trades have been missing.",
  //   since: 2024,
  // },
  // -------------------------------------------------------------------------
];

export default investors;
