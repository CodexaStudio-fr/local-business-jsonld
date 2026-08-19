/**
 * Union curée des `@type` schema.org dérivés de `LocalBusiness`, choisis pour
 * couvrir l'artisanat et les PME françaises. Volontairement **non exhaustive** :
 * l'échappatoire {@link AnyLocalBusinessType} couvre le reste du vocabulaire.
 *
 * Chaque valeur de cette union est un sous-type réel de `LocalBusiness` — le test
 * de types `test/types.test-d.ts` le vérifie contre `schema-dts`.
 */
export type LocalBusinessType =
  /** Générique, à utiliser quand aucun sous-type ne correspond. */
  | "LocalBusiness"

  // ── Bâtiment, artisanat, dépannage ────────────────────────────────────────
  /** Entreprise du bâtiment ou de l'habitat, générique. */
  | "HomeAndConstructionBusiness"
  /** Plombier, chauffagiste sanitaire. */
  | "Plumber"
  /** Électricien. */
  | "Electrician"
  /** Chauffage, ventilation, climatisation. */
  | "HVACBusiness"
  /** Couvreur, zingueur. */
  | "RoofingContractor"
  /** Entreprise générale du bâtiment, maçon. */
  | "GeneralContractor"
  /** Peintre en bâtiment. */
  | "HousePainter"
  /** Serrurier. */
  | "Locksmith"
  /** Déménageur. */
  | "MovingCompany"

  // ── Automobile ────────────────────────────────────────────────────────────
  /** Activité automobile, générique. */
  | "AutomotiveBusiness"
  /** Garage, réparation automobile. */
  | "AutoRepair"
  /** Carrosserie. */
  | "AutoBodyShop"
  /** Station de lavage. */
  | "AutoWash"
  /** Station-service. */
  | "GasStation"

  // ── Santé, beauté, bien-être ──────────────────────────────────────────────
  /** Santé et beauté, générique. */
  | "HealthAndBeautyBusiness"
  /** Salon de coiffure. */
  | "HairSalon"
  /** Institut de beauté. */
  | "BeautySalon"
  /** Onglerie. */
  | "NailSalon"
  /** Spa. */
  | "DaySpa"
  /** Salon de tatouage. */
  | "TattooParlor"
  /** Chirurgien-dentiste. */
  | "Dentist"
  /** Kinésithérapeute. */
  | "Physiotherapy"
  /** Opticien. */
  | "Optician"
  /** Pharmacie. */
  | "Pharmacy"
  /** Cabinet médical, centre de santé. */
  | "MedicalClinic"
  // Pas de vétérinaire ici : schema.org place `VeterinaryCare` sous
  // `MedicalOrganization`, pas sous `LocalBusiness`. L'échappatoire
  // {@link AnyLocalBusinessType} l'accepte quand même à l'exécution.

  // ── Restauration, alimentation ────────────────────────────────────────────
  /** Établissement de restauration, générique. */
  | "FoodEstablishment"
  /** Restaurant. */
  | "Restaurant"
  /** Café, salon de thé. */
  | "CafeOrCoffeeShop"
  /** Bar, brasserie, pub. */
  | "BarOrPub"
  /** Restauration rapide. */
  | "FastFoodRestaurant"
  /** Boulangerie, pâtisserie. */
  | "Bakery"
  /** Glacier. */
  | "IceCreamShop"
  /** Domaine viticole, cave. */
  | "Winery"

  // ── Services professionnels ───────────────────────────────────────────────
  /** Service professionnel, générique. */
  | "ProfessionalService"
  /** Service juridique, générique. */
  | "LegalService"
  /** Avocat. */
  | "Attorney"
  /** Notaire. */
  | "Notary"
  /** Expert-comptable. */
  | "AccountingService"
  /** Agent d'assurance, courtier. */
  | "InsuranceAgency"
  /** Agence immobilière. */
  | "RealEstateAgent"
  /** Agence de voyage. */
  | "TravelAgency"

  // ── Commerce de détail ────────────────────────────────────────────────────
  /** Commerce, générique. */
  | "Store"
  /** Prêt-à-porter. */
  | "ClothingStore"
  /** Quincaillerie, magasin de bricolage. */
  | "HardwareStore"
  /** Équipement de la maison. */
  | "HomeGoodsStore"
  /** Fleuriste. */
  | "Florist"
  /** Jardinerie. */
  | "GardenStore"
  /** Épicerie, supermarché. */
  | "GroceryStore"

  // ── Sport et loisirs ──────────────────────────────────────────────────────
  /** Lieu d'activité sportive, générique. */
  | "SportsActivityLocation"
  /** Salle de sport. */
  | "ExerciseGym"
  /** Club de remise en forme. */
  | "HealthClub"

  // ── Hébergement ───────────────────────────────────────────────────────────
  /** Hébergement, générique. */
  | "LodgingBusiness"
  /** Hôtel. */
  | "Hotel"
  /** Chambre d'hôtes, gîte. */
  | "BedAndBreakfast"

  // ── Divers ────────────────────────────────────────────────────────────────
  /** Crèche, garde d'enfants. */
  | "ChildCare"
  /** Pressing, blanchisserie. */
  | "DryCleaningOrLaundry"
  /** Garde-meubles, self-stockage. */
  | "SelfStorage";

/**
 * {@link LocalBusinessType} plus l'échappatoire : n'importe quel `@type`
 * schema.org sous `LocalBusiness` reste acceptable, sans perdre l'autocomplétion
 * sur l'union curée (astuce `string & {}`).
 */
export type AnyLocalBusinessType = LocalBusinessType | (string & {});

/**
 * La même liste, disponible à l'exécution — `validate()` a besoin de savoir
 * quels `@type` relèvent des règles LocalBusiness de Google.
 *

 * C'est le seul code exécutable de `src/types/`. L'annotation interdit qu'un type
 * étranger à l'union s'y glisse, et `test/business-types.test.ts` vérifie
 * l'inverse — que l'union ne contient rien qui manque au tableau.
 */
export const LOCAL_BUSINESS_TYPES: readonly LocalBusinessType[] = [
  "LocalBusiness",
  "HomeAndConstructionBusiness",
  "Plumber",
  "Electrician",
  "HVACBusiness",
  "RoofingContractor",
  "GeneralContractor",
  "HousePainter",
  "Locksmith",
  "MovingCompany",
  "AutomotiveBusiness",
  "AutoRepair",
  "AutoBodyShop",
  "AutoWash",
  "GasStation",
  "HealthAndBeautyBusiness",
  "HairSalon",
  "BeautySalon",
  "NailSalon",
  "DaySpa",
  "TattooParlor",
  "Dentist",
  "Physiotherapy",
  "Optician",
  "Pharmacy",
  "MedicalClinic",
  "FoodEstablishment",
  "Restaurant",
  "CafeOrCoffeeShop",
  "BarOrPub",
  "FastFoodRestaurant",
  "Bakery",
  "IceCreamShop",
  "Winery",
  "ProfessionalService",
  "LegalService",
  "Attorney",
  "Notary",
  "AccountingService",
  "InsuranceAgency",
  "RealEstateAgent",
  "TravelAgency",
  "Store",
  "ClothingStore",
  "HardwareStore",
  "HomeGoodsStore",
  "Florist",
  "GardenStore",
  "GroceryStore",
  "SportsActivityLocation",
  "ExerciseGym",
  "HealthClub",
  "LodgingBusiness",
  "Hotel",
  "BedAndBreakfast",
  "ChildCare",
  "DryCleaningOrLaundry",
  "SelfStorage",
];
