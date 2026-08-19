# Le DSL d'horaires

```ts
import { parseOpeningHours } from "local-business-jsonld/opening-hours";
```

Le format est celui d'OpenStreetMap, restreint à ce dont schema.org a besoin.
Une chaîne, une liste de `OpeningHoursSpecification` correctement découpée.

## Grammaire

```
spec      := rule (";" rule)*
rule      := "24/7"
           | days WS "off"
           | days WS ranges
days      := dayspec ("," dayspec)*
dayspec   := day ("-" day)?
day       := "Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su"
ranges    := range ("," range)*
range     := time "-" time
time      := HH ":" MM          -- 00:00 à 24:00
```

Insensible à la casse. Espaces libres autour des séparateurs. `;` final toléré,
règles vides ignorées. Une chaîne vide donne `[]`, sans lever d'erreur.

`parseOpeningHours` accepte aussi un tableau de chaînes, traité comme des règles
successives — pratique quand les horaires viennent d'un CMS ligne par ligne.

## Le modèle mental : la dernière règle gagne

Le parseur tient une table **jour → créneaux**. Chaque règle **remplace** les
créneaux des jours qu'elle nomme, elle ne s'y ajoute pas.

C'est ce qui fait que ces deux écritures se comportent comme on l'attend, sans
cas particulier dans le code :

```ts
parseOpeningHours("Mo-Fr 09:00-18:00; We off");
// → lundi, mardi, jeudi, vendredi 09:00-18:00. Mercredi disparaît.

parseOpeningHours("Mo-Fr 09:00-18:00; Fr 09:00-12:00");
// → lundi-jeudi 09:00-18:00, puis vendredi 09:00-12:00.
```

Écrivez donc du général au particulier, comme en CSS.

## La fusion

Après lecture, les jours qui partagent **exactement** le même ensemble de
créneaux sont regroupés dans une seule spec :

```ts
parseOpeningHours("Mo-Fr 09:00-18:00; Sa 09:00-18:00");
// → UNE spec, six jours. Pas deux.
```

C'est la forme que préfère le validateur Google, et l'ordre des créneaux ne
compte pas dans la comparaison : `"Mo 08:00-12:00,14:00-18:00"` et
`"Tu 14:00-18:00,08:00-12:00"` fusionnent.

Deux règles d'ordre, toujours appliquées :

- **Les jours** sortent de lundi à dimanche, jamais dans l'ordre d'écriture.
  `"Sa,Su,Mo 09:00-18:00"` donne `["Monday", "Saturday", "Sunday"]`.
- **Les groupes** sortent triés par premier jour de la semaine, et les créneaux
  d'un groupe par heure d'ouverture.

La sortie est donc déterministe : vos snapshots ne flappent pas.

## Tableau des cas

| Entrée | Sortie |
| --- | --- |
| `"Mo-Fr 09:00-18:00"` | 1 spec, lundi → vendredi |
| `"Mo,We,Fr 09:00-12:00"` | 1 spec, 3 jours |
| `"Mo-Fr 08:00-12:00,14:00-18:00"` | **2** specs, mêmes jours, un créneau chacune |
| `"Mo-Fr 09:00-18:00; Sa 09:00-12:00"` | 2 specs, jours distincts |
| `"Mo-Fr 09:00-18:00; Sa 09:00-18:00"` | 1 spec, 6 jours (fusion) |
| `"Mo-Su 00:00-23:59"` | 1 spec, 7 jours |
| `"24/7"` | 1 spec, 7 jours, `00:00` → `23:59` |
| `"Mo-Su 00:00-24:00"` | idem : `24:00` est normalisé en `23:59` |
| `"Th 22:00-02:00"` | 1 spec, `opens: "22:00"`, `closes: "02:00"` |
| `"Su off"` | `[]` — pas de spec vide |
| `"Mo-Fr 09:00-18:00; We off"` | 1 spec, mercredi retiré |
| `"Fr-Mo 09:00-18:00"` | 1 spec, `["Monday", "Friday", "Saturday", "Sunday"]` |
| `"Mo 9:00-18:00"` | `opens: "09:00"` — heure sur un chiffre acceptée |
| `""` | `[]` |

### Ouvert 24 heures

La convention Google est `opens: "00:00"`, `closes: "23:59"`. Jamais `24:00`,
jamais d'omission. Écrivez `"24/7"` ou `"Mo-Su 00:00-24:00"` : la sortie sera
`23:59` dans les deux cas. `validate()` émet un avertissement `closes-at-24` si
un `24:00` traîne dans un nœud construit à la main.

### Chevauchement de minuit

`"Th 22:00-02:00"` sort tel quel, avec `closes` inférieur à `opens`. C'est
schema.org qui interprète : « si `closes` est plus petit que `opens`, le créneau
franchit le lendemain ». Aucun découpage artificiel en deux specs.

### Jours fériés

`PublicHolidays` existe dans schema.org mais pas dans ce DSL : les jours fériés
français sont des dates, pas un jour de semaine récurrent. Utilisez
`specialOpeningHours` (ci-dessous), qui produit des specs datées — c'est ce que
Google lit réellement.

## Les erreurs

Toutes dérivent de `OpeningHoursError` et portent la **position** du fragment
fautif dans la chaîne d'origine. Sans ça, débugger une chaîne de soixante
caractères est pénible.

```ts
import { InvalidDayError, parseOpeningHours } from "local-business-jsonld/opening-hours";

try {
  parseOpeningHours("Mo-Fr 09:00-18:00; Xx 09:00-12:00");
} catch (error) {
  if (error instanceof InvalidDayError) {
    error.token; // "Xx"
    error.position; // 19
  }
}
```

| Entrée | Erreur |
| --- | --- |
| `"Xx 09:00-18:00"` | `InvalidDayError` |
| `"Mo-Zz 09:00-18:00"` | `InvalidDayError` |
| `"09:00-18:00"` | `InvalidDayError` — préfixez par des jours |
| `"Mo 25:00-26:00"` | `InvalidTimeError` |
| `"Mo 09:60-18:00"` | `InvalidTimeError` |
| `"Mo 24:30-25:00"` | `InvalidTimeError` — `24:00` est le maximum |
| `"Mo 0900-1800"` | `InvalidTimeError` — le `:` est obligatoire |
| `"Mo 09:00-09:00"` | `InvalidTimeError` — durée nulle |
| `"Mo 09:00-"` | `InvalidTimeError` |
| `"Mo"` | `OpeningHoursError` — ni créneau ni `off` |

Ces erreurs sont **levées**, pas collectées : un DSL d'horaires invalide est une
faute de saisie côté développeur ou côté CMS, pas une donnée à publier à moitié.
Si vos horaires viennent d'une source non fiable, entourez l'appel.

## Horaires exceptionnels

`specialOpeningHours` produit des specs datées, à placer dans
`specialOpeningHoursSpecification`. `localBusiness()` s'en occupe.

```ts
localBusiness({
  // …
  specialOpeningHours: [
    { date: "2026-12-25", closed: true },
    { from: "2026-08-01", to: "2026-08-15", closed: true },
    { date: "2026-07-14", opens: "10:00", closes: "16:00" },
  ],
});
```

```json
[
  { "@type": "OpeningHoursSpecification", "opens": "00:00", "closes": "00:00",
    "validFrom": "2026-12-25", "validThrough": "2026-12-25" },
  { "@type": "OpeningHoursSpecification", "opens": "00:00", "closes": "00:00",
    "validFrom": "2026-08-01", "validThrough": "2026-08-15" },
  { "@type": "OpeningHoursSpecification", "opens": "10:00", "closes": "16:00",
    "validFrom": "2026-07-14", "validThrough": "2026-07-14" }
]
```

`closed: true` donne `opens: "00:00"`, `closes: "00:00"` — la convention Google
pour « fermé ce jour-là ».

Les règles, toutes vérifiées à l'appel :

- `date` seul, **ou** `from` (avec `to` optionnel). Les mélanger lève une erreur.
- Dates en `YYYY-MM-DD`. `"25/12/2026"` et `"2026-02-30"` lèvent
  `InvalidDateError`.
- `to` antérieur à `from` lève `InvalidDateError`.
- `closed: true` exclut `opens`/`closes`. Sans `closed`, les deux sont exigés.
- L'ordre des entrées est conservé.

### Une note sur le type du nœud

schema.org **n'a pas** de `@type` `SpecialOpeningHoursSpecification`. C'est la
*propriété* qui s'appelle `specialOpeningHoursSpecification` ; son domaine de
valeurs est `OpeningHoursSpecification`. Ce paquet émet donc
`"@type": "OpeningHoursSpecification"` avec `validFrom`/`validThrough`. Émettre
un type inexistant ferait échouer le Schema Markup Validator.

## Et les fuseaux ?

Non gérés, volontairement. schema.org exprime ces horaires en heure locale de
l'établissement, sans fuseau : `"09:00"` signifie « neuf heures là-bas ». Aucune
conversion, aucune dépendance à un moteur de dates.
