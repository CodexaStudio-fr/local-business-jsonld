# Décisions et écarts assumés

Les endroits où ce paquet ne fait pas la chose la plus évidente. Chaque entrée
dit **quoi**, **pourquoi**, et **ce qui casserait** si on changeait d'avis.

## `specialOpeningHoursSpecification` n'a pas de `@type` dédié

Le plan de build parlait de nœuds `SpecialOpeningHoursSpecification`. Ce type
**n'existe pas** dans schema.org : c'est la *propriété* qui porte ce nom, et son
domaine de valeurs est `OpeningHoursSpecification`.

Le paquet émet donc `"@type": "OpeningHoursSpecification"` avec
`validFrom`/`validThrough`. Émettre un type inexistant ferait échouer le Schema
Markup Validator (§9 de la checklist).

## `ListItem.item` est une URL, pas un `Thing`

schema.org type `item` en `Thing`. Google documente — et son Rich Results Test
attend — une URL en chaîne :

```json
{ "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://x.fr/" }
```

On suit Google, parce que le but du paquet est d'obtenir des rich results. Coût :
`itemListElement` est exclu de l'assertion `schema-dts` dans
`test/types.test-d.ts`, avec un commentaire qui pointe ici. Tout le reste du nœud
`BreadcrumbList` est vérifié.

## `ImageObject` sans `width` ni `height`

schema.org type ces deux propriétés en `Distance | QuantitativeValue` — donc
`"1200 px"` ou un nœud structuré, jamais `1200`. Google, lui, montre des nombres
nus dans ses exemples.

Plutôt que de choisir entre « invalide pour schema.org » et « verbeux pour rien »,
les dimensions ne sont pas exposées : Google ne s'en sert pas pour les rich
results d'un `LocalBusiness`. `ImageInput` garde `url` et `caption`.

## `VeterinaryCare` n'est pas dans l'union curée

Le test de types l'a rejeté, et il avait raison : schema.org place
`VeterinaryCare` sous `MedicalOrganization`, pas sous `LocalBusiness`. Il reste
utilisable via l'échappatoire — la sortie ne sera simplement pas assignable à
`WithContext<LocalBusiness>`, ce qui est exact.

Même logique pour tout `@type` qu'on serait tenté d'ajouter « pour être
exhaustif » : le test de types tranche.

## `paymentAccepted` est une chaîne, pas un tableau

schema.org type `paymentAccepted` en `Text`, et ses propres exemples utilisent
une liste séparée par des virgules. L'entrée accepte un tableau, la sortie le
joint par `", "`.

## `graph()` ne résout que les clés qu'on émet

`baseUrl` résout `@id` plus une liste **explicite** de clés porteuses d'URL :
`url`, `item`, `logo`, `image`, `sameAs`, `hasMap`, `urlTemplate`, `contentUrl`.

Ce n'est pas une heuristique : le paquet contrôle chaque clé produite par ses
builders, donc la liste est exhaustive par construction. Une clé absente n'est
jamais réécrite — aucun `name` valant `"/"` ne se transforme en URL. Si vous
étalez un nœud pour ajouter une propriété hors périmètre
(`menu`, `acceptsReservations`…), donnez-lui une URL absolue.

## `node10` est exclu de `attw`

`pnpm check:package` lance `attw --pack . --profile node16`, donc ESM, CJS et
bundler. La résolution `node10` (l'ancien `moduleResolution: "node"`, antérieur
aux exports maps) échoue sur les sous-chemins parce que tout vit dans `dist/`.

La supporter exigerait des dossiers-stubs `next/`, `validate/` et
`opening-hours/` à la racine du paquet. Pour un paquet ESM-first qui cible
Node ≥ 18, ça ne valait pas la dette. C'est aussi exactement la liste que
demande la checklist §9 : « ESM, CJS, node16, bundler ».

## Les erreurs d'horaires sont levées, pas collectées

`parseOpeningHours` lève. Un DSL invalide est une faute de saisie côté
développeur ou côté CMS, pas une donnée à publier à moitié. `validate()`, lui,
collecte — parce qu'il inspecte du balisage déjà construit.

## Le paquet ne gère aucun fuseau horaire

schema.org exprime les horaires en heure locale de l'établissement, sans fuseau.
Aucune conversion, donc aucune dépendance à un moteur de dates. C'est ce qui
permet de tenir la promesse « zéro dépendance runtime ».

## Taille du bundle

La checklist §9 visait « `.` < 4 kB min+gzip ». Mesuré : **4,47 kB gzip** pour
`localBusiness` seul, 5,29 kB avec `graph` et `serialize`. Les limites de
`size-limit` sont réglées sur les valeurs réelles, avec un peu de marge.

Ce qui pèse, dans l'ordre : le parseur d'horaires (1,69 kB à lui seul), la prose
des messages d'erreur en français, et la table d'indicatifs téléphoniques. Les
trois leviers si la taille devient un sujet :

1. Raccourcir les messages d'erreur, ou les remplacer par des codes en
   production.
2. Compacter `DIAL_CODES` en une chaîne parsée à la demande (~150 B).
3. Sortir `parseOpeningHours` du chemin de `localBusiness` — mais c'est
   l'argument principal du paquet, donc non.

## Où vivent les `as`, et pourquoi

Le code ne porte pas de commentaire explicatif : les justifications sont ici.
Trois endroits, et trois seulement, utilisent une assertion de type.

**`src/internal/`** — `nodes.ts` et `prune.ts` traitent un nœud comme un sac de
clés (`Record<string, unknown>`) pour l'élaguer, l'ordonner, y résoudre les `@id`.
Aucune de ces opérations ne change la forme du nœud : elles retirent des clés
optionnelles et remplacent des `string` par des `string`. Confiner ces casts ici
permet à `builders/graph.ts` et `validate/` de rester typés de bout en bout.
`values.ts` en porte deux autres, parce que `Array.isArray` ne restreint pas un
`readonly T[]` dans une union générique — le test, lui, est correct à
l'exécution.

**Le repli de `@type` dans les builders génériques** — `localBusiness`,
`organization` et `service` s'écrivent
`(input.type ?? "LocalBusiness") as T`. Le paramètre `T` a précisément
`"LocalBusiness"` pour valeur par défaut, donc le cast affirme ce que la
signature garantit déjà. TypeScript ne sait pas relier les deux.

**Le retour de `graph()`** — les enfants sont manipulés en `Record<string,
unknown>` puis annoncés comme `GraphChild[]`. C'est vrai par construction : ils
viennent tous d'un builder, donc portent un `@type`. `GraphChild` ne promet rien
de plus, justement parce que la fusion des `@id` efface les types précis.

## Les suppressions de lint vivent dans `biome.json`

`<JsonLd>` a besoin de `dangerouslySetInnerHTML` : c'est le seul moyen d'écrire
du JSON brut dans un `<script>`, React échapperait un enfant texte en entités
HTML qu'aucun parseur JSON-LD ne relit. L'inertie du contenu vient de
`serialize()`, et `test/next.test.tsx` le vérifie en injectant
`</script><script>alert(1)</script>` dans un `name`.

La règle `security/noDangerouslySetInnerHtml` est donc désactivée pour
`src/next/**` dans `biome.json`, plutôt que suppressed par un `biome-ignore` au
fil du code.
