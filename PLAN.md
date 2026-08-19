# Plan de build — `local-business-jsonld`

> Générateur JSON-LD `LocalBusiness` typé, zéro dépendance runtime, avec adaptateur React/Next.
> Document de spec destiné à être posé à la racine du repo et donné à Claude Code phase par phase.

---

## 0. Positionnement (à lire avant d'écrire une ligne)

**La concurrence est vivante, pas morte.** Vérifié sur le registry :

| Package | Dernière version | Publiée le |
|---|---|---|
| `next-seo` (inclut `next-seo/jsonld`) | 7.3.0 | 2026-07-29 |
| `schema-dts` (Google) | 2.0.0 | 2026-03-23 |
| `react-schemaorg` (Google) | 2.0.1 | 2026-02-19 |

Donc **ce n'est pas un océan bleu**. `next-seo` sait déjà cracher un `LocalBusinessJsonLd`. Ne pars pas là-dedans en croyant combler un vide — pars là-dedans en assumant que c'est un **wrapper d'ergonomie** sur un problème que tu résous 15 fois par an chez CodexaStudio.

**Les 4 vrais différenciateurs** (si tu n'en tiens aucun, le package n'a pas de raison d'exister) :

1. **Le DSL d'horaires.** `"Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00"` → tableau d'`OpeningHoursSpecification` fusionné correctement. Personne ne fait ça proprement. C'est 80 % de la valeur du package et 80 % de la difficulté technique.
2. **La composition en `@graph`.** Un seul `<script>` qui contient `LocalBusiness` + `WebSite` + `BreadcrumbList` + `FAQPage` reliés par `@id`. C'est ce que font les vrais sites qui rankent ; les libs existantes te font empiler 4 balises `<script>` déconnectées.
3. **Zéro dépendance runtime + tree-shakeable.** `next-seo` traîne toute une lib SEO. Toi tu vends 3 kB.
4. **Ergonomie FR/EU.** Presets artisans (`Plumber`, `Electrician`, `HairSalon`…), téléphone E.164, `priceRange` en `€`, `addressCountry` par défaut, validation des règles Google *rich results* en français dans les messages d'erreur.

**Noms npm libres** (vérifiés) : `local-business-jsonld`, `localbusiness-ld`, `local-schema-ld`, `next-local-business`, `nextjs-local-seo`, `artisan-schema`.

→ Recommandation : **`local-business-jsonld`**. Descriptif, cherchable, pas de squat de la marque Next.

---

## 1. API publique (le contrat — c'est la partie la plus importante à figer)

### 1.1 Builder principal

```ts
import { localBusiness } from "local-business-jsonld";

const business = localBusiness({
  type: "Plumber",                          // union curée + escape hatch string
  id: "https://plomberie-dupont.fr/#business",
  name: "Plomberie Dupont",
  description: "Dépannage et installation sanitaire au Mans depuis 1998.",
  url: "https://plomberie-dupont.fr",
  telephone: "+33243123456",                // validé E.164
  email: "contact@plomberie-dupont.fr",
  priceRange: "€€",
  currenciesAccepted: "EUR",
  paymentAccepted: ["Cash", "CreditCard", "CheckInAdvance"],
  image: [
    "https://plomberie-dupont.fr/og-1x1.jpg",
    "https://plomberie-dupont.fr/og-4x3.jpg",
    "https://plomberie-dupont.fr/og-16x9.jpg",
  ],
  logo: "https://plomberie-dupont.fr/logo.png",
  address: {
    street: "12 rue Nationale",
    city: "Le Mans",
    region: "Pays de la Loire",
    postalCode: "72000",
    country: "FR",                          // défaut configurable
  },
  geo: { lat: 48.0061, lng: 0.1996 },
  openingHours: "Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00",
  specialOpeningHours: [
    { date: "2026-12-25", closed: true },
    { from: "2026-08-01", to: "2026-08-15", closed: true },
  ],
  areaServed: ["Le Mans", "Sarthe", "Pays de la Loire"],
  sameAs: [
    "https://www.facebook.com/plomberiedupont",
    "https://g.page/plomberie-dupont",
  ],
  aggregateRating: { value: 4.8, count: 37 },  // ⚠️ voir §8 (règle Google)
  founder: "Marc Dupont",
  foundingDate: "1998",
  vatID: "FR12345678901",
});
```

**Sortie** : objet JSON-LD `WithContext<LocalBusiness>` valide, propriétés `undefined` élaguées récursivement, clés ordonnées (`@context`, `@type`, `@id`, puis alpha) pour des snapshots stables.

### 1.2 Builders secondaires

```ts
website({ id, url, name, inLanguage, publisher, searchAction })
organization({ id, name, url, logo, sameAs })
breadcrumbs([{ name, url }, …])
faq([{ question, answer }, …])
service({ id, name, provider, areaServed, offers })
review({ author, rating, body, datePublished })
```

### 1.3 Composition

```ts
import { graph } from "local-business-jsonld";

const jsonLd = graph(
  localBusiness({ id: "#business", … }),
  website({ id: "#website", publisher: "#business", … }),
  breadcrumbs([…]),
);
// → { "@context": "https://schema.org", "@graph": [ … ] }
```

**Règles impératives du `graph()`** :

- `@context` retiré des enfants, hissé au niveau racine (une seule fois).
- Les `@id` relatifs (`"#business"`) sont résolus en absolus si `baseUrl` est fourni : `graph({ baseUrl }, …nodes)`.
- Les références croisées (`publisher: "#business"`) deviennent `{ "@id": "https://…/#business" }`.
- Dédoublonnage : deux nœuds avec le même `@id` → merge shallow + warning en dev.

### 1.4 Rendu

```tsx
import { JsonLd } from "local-business-jsonld/next";

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
    </>
  );
}
```

Et l'échappatoire framework-agnostique :

```ts
import { serialize } from "local-business-jsonld";

const html = serialize(jsonLd); // string prête à injecter dans un <script>
```

### 1.5 Validation

```ts
import { validate } from "local-business-jsonld/validate";

const { valid, errors, warnings } = validate(jsonLd, { locale: "fr" });
// errors   → bloque les rich results (name, address manquants…)
// warnings → recommandé par Google (image, geo, openingHours, telephone…)
```

### 1.6 Sous-chemins d'export

| Export | Contenu | Peer deps |
|---|---|---|
| `.` | builders, `graph`, `serialize`, types | aucune |
| `./next` | `<JsonLd>` (server component) | `react` (optionnelle) |
| `./validate` | validateur runtime | aucune |
| `./opening-hours` | `parseOpeningHours` seul | aucune |

---

## 2. Le DSL d'horaires (le cœur — TDD obligatoire)

### 2.1 Grammaire

```
spec      := rule (";" rule)*
rule      := "24/7"
           | days WS "off"
           | days WS ranges
days      := dayspec ("," dayspec)*
dayspec   := day ("-" day)?
day       := "Mo"|"Tu"|"We"|"Th"|"Fr"|"Sa"|"Su"
ranges    := range ("," range)*
range     := time "-" time
time      := HH ":" MM          -- 00:00 → 24:00
```

Insensible à la casse, espaces libres, `;` final toléré.

### 2.2 Cas limites à couvrir en test (écris les tests AVANT le parser)

| Entrée | Attendu |
|---|---|
| `"Mo-Fr 09:00-18:00"` | 1 spec, `dayOfWeek: [Monday…Friday]` |
| `"Mo,We,Fr 09:00-12:00"` | 1 spec, 3 jours |
| `"Mo-Fr 08:00-12:00,14:00-18:00"` | **2** specs (une par créneau), mêmes jours |
| `"Mo-Fr 09:00-18:00; Sa 09:00-12:00"` | 2 specs, jours distincts |
| `"Mo-Su 00:00-23:59"` / `"24/7"` | 1 spec, 7 jours, `00:00`→`23:59` (convention Google) |
| `"Th 22:00-02:00"` | chevauchement minuit → spec unique, `closes: "02:00"`, documenté |
| `"Su off"` | dimanche absent de la sortie (pas de spec vide) |
| `"Mo-Fr 09:00-18:00; We off"` | mercredi retiré du groupe Mo-Fr |
| `"Fr-Mo 09:00-18:00"` | wrap-around semaine → Fr, Sa, Su, Mo |
| `"Mo 25:00-26:00"` | throw `InvalidTimeError` |
| `"Xx 09:00-18:00"` | throw `InvalidDayError` avec position dans la string |
| `""` | `[]`, pas de throw |

### 2.3 Fusion

Après parsing, **grouper les jours qui partagent exactement le même ensemble de créneaux**. `Mo-Fr 9-18` + `Sa 9-18` doit sortir **une seule** spec avec 6 jours, pas deux. C'est ce que le validateur Google préfère et c'est le détail qui fait « lib sérieuse ».

Ordre des jours en sortie : lundi → dimanche, jamais l'ordre d'écriture de l'utilisateur.

### 2.4 Horaires exceptionnels

`specialOpeningHours` → nœuds `SpecialOpeningHoursSpecification` séparés avec `validFrom`/`validThrough`. `closed: true` → `opens: "00:00"`, `closes: "00:00"` (convention Google pour « fermé ce jour-là »).

### 2.5 Timezone

**Non géré, et c'est documenté.** schema.org exprime les horaires en heure locale de l'établissement, sans fuseau. Ajoute une ligne dans le README pour couper court aux issues.

---

## 3. Arborescence

```
local-business-jsonld/
├── src/
│   ├── index.ts                 # ré-exports publics uniquement
│   ├── types/
│   │   ├── input.ts             # types d'entrée (l'API ergonomique)
│   │   ├── output.ts            # types de sortie schema.org minimaux
│   │   └── business-types.ts    # union des @type LocalBusiness
│   ├── builders/
│   │   ├── local-business.ts
│   │   ├── website.ts
│   │   ├── organization.ts
│   │   ├── breadcrumbs.ts
│   │   ├── faq.ts
│   │   ├── service.ts
│   │   └── graph.ts
│   ├── opening-hours/
│   │   ├── parse.ts
│   │   ├── merge.ts
│   │   └── days.ts
│   ├── validate/
│   │   ├── index.ts
│   │   └── messages.fr.ts
│   ├── internal/
│   │   ├── prune.ts             # retire les undefined récursivement
│   │   ├── phone.ts             # normalisation E.164
│   │   └── url.ts               # résolution des @id relatifs
│   ├── serialize.ts
│   └── next/
│       └── index.tsx            # <JsonLd>
├── test/
│   ├── opening-hours.test.ts
│   ├── local-business.test.ts
│   ├── graph.test.ts
│   ├── serialize.test.ts
│   ├── validate.test.ts
│   ├── types.test-d.ts          # tests de types (assignabilité schema-dts)
│   └── __snapshots__/
├── examples/
│   └── next-app/                # app router minimale, 1 page artisan
├── docs/
│   ├── opening-hours.md
│   ├── recipes.md               # « site d'artisan », « restaurant », « multi-établissements »
│   └── migration-next-seo.md
├── .changeset/
├── .github/workflows/
│   ├── ci.yml
│   └── release.yml
├── CLAUDE.md
├── README.md
├── biome.json
├── tsconfig.json
├── tsdown.config.ts
├── vitest.config.ts
└── package.json
```

---

## 4. Stack & tooling

| Rôle | Choix | Pourquoi |
|---|---|---|
| Gestionnaire | **pnpm** | rapide, strict sur les deps fantômes |
| Build | **tsdown** (ou `tsup`) | dual ESM/CJS + `.d.ts` en une commande |
| Tests | **vitest** | snapshots + `expectTypeOf` natif |
| Lint/format | **Biome** | tu l'utilises déjà partout |
| Versioning | **changesets** | changelog auto + release PR |
| Vérif package | **publint** + **@arethetypeswrong/cli** | attrape les exports maps cassés avant npm |
| Types de référence | **schema-dts** en `devDependency` | tests de types, jamais expédié |

**Dépendances runtime : zéro.** C'est un argument marketing, tiens-le.

### `package.json` (squelette)

```jsonc
{
  "name": "local-business-jsonld",
  "version": "0.0.0",
  "type": "module",
  "sideEffects": false,
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./next": {
      "types": "./dist/next/index.d.ts",
      "import": "./dist/next/index.js",
      "require": "./dist/next/index.cjs"
    },
    "./validate": { /* idem */ },
    "./opening-hours": { /* idem */ },
    "./package.json": "./package.json"
  },
  "peerDependencies": { "react": ">=18" },
  "peerDependenciesMeta": { "react": { "optional": true } },
  "scripts": {
    "build": "tsdown",
    "test": "vitest run",
    "test:types": "vitest typecheck",
    "lint": "biome check .",
    "check:package": "publint && attw --pack .",
    "release": "changeset publish"
  }
}
```

---

## 5. Roadmap en phases (une phase ≈ une session Claude Code, un commit)

### Phase 0 — Scaffold

Init pnpm, TS strict, Biome, vitest, tsdown, structure de dossiers vide, CI qui tourne à vide.
**Critère de sortie** : `pnpm build && pnpm test && pnpm lint` vert sur un repo quasi vide.

### Phase 1 — Types

`business-types.ts` (union curée d'environ 40 `@type` pertinents pour l'artisanat/PME + escape hatch `(string & {})`), `input.ts`, `output.ts`, `prune.ts`.
**Critère** : aucun code exécutable encore, mais `tsc --noEmit` passe et les types se lisent bien en autocomplétion.

### Phase 2 — Opening hours (**la phase à ne pas déléguer aveuglément**)

Écris d'abord le tableau de cas §2.2 sous forme de tests, *puis* laisse Claude Code implémenter jusqu'au vert. Ne le laisse pas écrire tests et implémentation dans la même passe — il fera coïncider les deux sur un parser bancal.
**Critère** : 100 % des cas §2.2 verts, y compris les throws.

### Phase 3 — Builder `localBusiness`

Adresse, geo, images, contact, branchement du parser d'horaires.
**Critère** : snapshot d'un cas artisan complet + test de type contre `WithContext<LocalBusiness>` de schema-dts.

### Phase 4 — Builders secondaires + `graph()`

`website`, `organization`, `breadcrumbs`, `faq`, résolution des `@id`, dédoublonnage.
**Critère** : un `@graph` de 4 nœuds liés, snapshot, `@context` unique.

### Phase 5 — `serialize()` + `<JsonLd>`

Échappement XSS (§8), sous-export `/next`, vérification que le composant est bien un server component (aucun hook, aucun `"use client"`).
**Critère** : test qui injecte `</script><script>alert(1)` dans un `name` et vérifie que la sortie est inerte.

### Phase 6 — `validate()`

Règles Google : requis (`name`, `address`), recommandés (`image`, `telephone`, `priceRange`, `url`, `geo`, `openingHoursSpecification`), cohérence `aggregateRating` (`count > 0`, `1 ≤ value ≤ 5`).
**Critère** : messages en français, chaque message pointe une propriété précise.

### Phase 7 — Docs, exemple, README

README avec un exemple qui tient à l'écran dans les 20 premières lignes. App Next d'exemple dans `examples/`. `docs/recipes.md` avec 3 recettes concrètes.
**Critère** : quelqu'un qui ne connaît pas schema.org copie-colle et ça marche.

### Phase 8 — Release

Changesets, CI (matrice Node 20/22/24), publint + attw en CI, publication npm avec **provenance** via OIDC (pas de token longue durée dans les secrets).
**Critère** : `0.1.0` publiée, badge provenance visible sur npmjs.

### Phase 9 — Validation terrain (**manuelle, pas déléguable**)

Déploie l'app d'exemple, passe l'URL dans le **Rich Results Test** de Google et le **Schema Markup Validator** de schema.org. Corrige. Tant que ces deux outils ne sont pas verts, la lib ne vaut rien, quels que soient tes tests unitaires.

---

## 6. `CLAUDE.md` à poser à la racine

Voir [CLAUDE.md](./CLAUDE.md).

---

## 7. Prompts de démarrage pour Claude Code

**Phase 2 (la plus délicate) — en deux temps :**

> Passe 1 : « Lis `docs/opening-hours.md` et la section 2.2 de PLAN.md. Écris uniquement `test/opening-hours.test.ts` : un test par ligne du tableau de cas limites, avec les sorties `OpeningHoursSpecification` attendues écrites à la main. N'écris aucune implémentation, les tests doivent échouer. »
>
> Passe 2 : « Implémente `src/opening-hours/{days,parse,merge}.ts` jusqu'à ce que `pnpm test opening-hours` soit vert. Interdiction de modifier les tests. Si un test te paraît incorrect, arrête-toi et explique pourquoi. »

**Phase 5 :**

> « Implémente `src/serialize.ts`. Contrainte : la sortie doit être sûre à injecter dans `<script type="application/ld+json">`. Écris d'abord un test avec une charge `</script><script>alert(1)</script>` dans le champ `name` et un `&` dans `description`, puis implémente. Explique dans un commentaire pourquoi chaque caractère est échappé. »

---

## 8. Pièges à connaître (chacun m'a coûté un debug ailleurs)

1. **Échappement dans `<script>`.** `JSON.stringify` n'échappe pas `<`. Un `name` contenant `</script>` casse la page et ouvre une XSS. Remplace `<` → `\u003c`, `>` → `\u003e`, `&` → `\u0026`. C'est valide JSON et inerte en HTML.
2. **`@context` dupliqué dans un `@graph`.** Erreur classique : les enfants gardent leur `@context`. Le validateur schema.org ne bronche pas toujours mais Google, si.
3. **`aggregateRating` auto-déclaré.** Google interdit les avis collectés et affichés par l'entreprise elle-même sur sa propre page pour les rich results. Un `aggregateRating` renseigné à la main sans source vérifiable = pénalité ou ignoré. Mets un **warning explicite** dans `validate()` et une note en gras dans le README, sinon tes clients artisans vont se faire retoquer et ce sera ta lib qu'ils blâmeront.
4. **Convention 24 h.** `opens: "00:00", closes: "23:59"`. Pas `24:00`, pas d'omission.
5. **`@id` sans fragment.** Sans `#business`, `#website`, tu ne peux pas lier les nœuds et le graph perd tout intérêt. Impose le fragment, ou génère-le.
6. **Téléphone.** E.164 (`+33243123456`), pas `02 43 12 34 56`. Normalise, et lève une erreur claire si l'entrée est ambiguë sans indicatif pays.
7. **`schema-dts` en dépendance runtime.** Ses types sont énormes et plombent le `tsc` des consommateurs. devDep uniquement.
8. **Exports map cassée.** C'est *la* cause n°1 de bug sur les packages dual ESM/CJS. `attw --pack` en CI, non négociable.
9. **Ordre des clés.** Non déterministe → snapshots qui flappent. Trie à la sérialisation.
10. **Hydration.** Aucun risque tant que `<JsonLd>` reste un server component sans état. Si quelqu'un propose un `useEffect`, c'est non.

---

## 9. Checklist avant `1.0.0`

- [ ] Rich Results Test de Google : vert sur l'app d'exemple déployée
- [ ] Schema Markup Validator : 0 erreur, 0 warning
- [ ] `attw --pack` : aucun problème sur ESM, CJS, node16, bundler
- [ ] `publint` : propre
- [ ] Bundle `.` < 4 kB min+gzip (mesure avec `size-limit` en CI)
- [ ] Couverture > 90 % sur `opening-hours/` et `builders/`
- [ ] README : exemple fonctionnel dans les 20 premières lignes
- [ ] Provenance npm active (badge visible)
- [ ] LICENSE MIT
- [ ] Utilisé en vrai sur au moins 2 sites clients CodexaStudio avant d'annoncer

**Le dernier point est le plus important.** Sortir en `0.x`, l'utiliser sur tes propres sites d'artisans pendant un mois, corriger ce qui gratte, *puis* `1.0.0`. Un package qu'on annonce avant de l'avoir utilisé soi-même se fait démolir en issues dans la semaine.

---

## 10. Estimation

| Phase | Charge |
|---|---|
| 0–1 (scaffold + types) | 2–3 h |
| 2 (opening hours) | 4–6 h |
| 3–4 (builders + graph) | 3–4 h |
| 5–6 (serialize + validate) | 2–3 h |
| 7 (docs + exemple) | 3–4 h |
| 8–9 (release + validation Google) | 2–3 h |

**Total ≈ 16–23 h**, soit deux week-ends tranquilles. Le maintien ensuite est faible : schema.org bouge lentement, et le scope est verrouillé.
