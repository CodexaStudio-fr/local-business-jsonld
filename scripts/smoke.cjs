const assert = require("node:assert/strict");
const { localBusiness, serialize } = require("../dist/index.cjs");
const { parseOpeningHours } = require("../dist/opening-hours/index.cjs");
const { validate } = require("../dist/validate/index.cjs");

const node = localBusiness({
  type: "Bakery",
  id: "https://x.fr/#business",
  name: "Boulangerie Martin",
  url: "https://x.fr",
  telephone: "+33243123456",
  priceRange: "€",
  image: ["https://x.fr/a.jpg"],
  address: { street: "1 rue du Four", city: "Le Mans", postalCode: "72000" },
  geo: { lat: 48.0, lng: 0.2 },
  openingHours: "Tu-Su 07:00-13:00",
});

assert.equal(node["@type"], "Bakery");
assert.equal(node["@context"], "https://schema.org");
assert.deepEqual(node.openingHoursSpecification[0].dayOfWeek, [
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);
assert.deepEqual(validate(node).errors, []);
assert.equal(serialize({ name: "Dupont & Fils" }), '{"name":"Dupont \\u0026 Fils"}');
assert.equal(parseOpeningHours("Su off").length, 0);

console.log(`CJS ok sur Node ${process.version}`);
