/**
 * Sous-types `LocalBusiness` couverts par l'autocomplétion. Non exhaustif :
 * {@link AnyLocalBusinessType} accepte le reste du vocabulaire schema.org.
 */
export type LocalBusinessType =
  /** Générique, à utiliser quand aucun sous-type ne correspond. */
  | "LocalBusiness"
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
  /** Lieu d'activité sportive, générique. */
  | "SportsActivityLocation"
  /** Salle de sport. */
  | "ExerciseGym"
  /** Club de remise en forme. */
  | "HealthClub"
  /** Hébergement, générique. */
  | "LodgingBusiness"
  /** Hôtel. */
  | "Hotel"
  /** Chambre d'hôtes, gîte. */
  | "BedAndBreakfast"
  /** Crèche, garde d'enfants. */
  | "ChildCare"
  /** Pressing, blanchisserie. */
  | "DryCleaningOrLaundry"
  /** Garde-meubles, self-stockage. */
  | "SelfStorage";

/** {@link LocalBusinessType} plus n'importe quel autre `@type` schema.org. */
export type AnyLocalBusinessType = LocalBusinessType | (string & {});

/** La même liste à l'exécution, pour `validate()`. */
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
