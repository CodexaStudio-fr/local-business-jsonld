import assert from "node:assert/strict";
import { graph, localBusiness, parseOpeningHours, serialize, website } from "../dist/index.js";
import { parseOpeningHours as fromSubpath } from "../dist/opening-hours/index.js";
import { validate } from "../dist/validate/index.js";

const document = graph(
  { baseUrl: "https://x.fr" },
  localBusiness({
    type: "Plumber",
    id: "#business",
    name: "Plomberie Dupont",
    url: "/",
    telephone: "02 43 12 34 56",
    priceRange: "€€",
    image: ["/a.jpg"],
    address: { street: "12 rue Nationale", city: "Le Mans", postalCode: "72000" },
    geo: { lat: 48.0061, lng: 0.1996 },
    openingHours: "Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00",
  }),
  website({ id: "#website", url: "/", publisher: "#business" }),
);

const [business, site] = document["@graph"];

assert.equal(document["@context"], "https://schema.org");
assert.deepEqual(Object.keys(document), ["@context", "@graph"]);
assert.deepEqual([business["@type"], site["@type"]], ["Plumber", "WebSite"]);
assert.equal(business["@id"], "https://x.fr/#business");
assert.equal(business.telephone, "+33243123456");
assert.equal(business.openingHoursSpecification.length, 3);
assert.deepEqual(site.publisher, { "@id": "https://x.fr/#business" });

const report = validate(document);
assert.equal(report.valid, true);
assert.deepEqual([report.errors.length, report.warnings.length], [0, 0]);

const escaped = serialize({ name: "</script><script>alert(1)</script>" });
assert.ok(!escaped.includes("</script"));
assert.equal(JSON.parse(escaped).name, "</script><script>alert(1)</script>");

assert.equal(parseOpeningHours("24/7")[0].closes, "23:59");
assert.equal(fromSubpath("24/7")[0].closes, "23:59");

console.log(`ESM ok sur Node ${process.version}`);
