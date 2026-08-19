import { serialize } from "@codexastudio/local-business-jsonld";
import { validate } from "@codexastudio/local-business-jsonld/validate";
import { BUSINESS, buildJsonLd, QUESTIONS } from "@/lib/business";

const jsonLd = buildJsonLd();
const report = validate(jsonLd);

const card: React.CSSProperties = {
  border: "1px solid #d4d4d8",
  borderRadius: "0.5rem",
  padding: "1rem 1.25rem",
};

export default function Page() {
  return (
    <main>
      <h1>{BUSINESS.name}</h1>
      <p>{BUSINESS.description}</p>

      <section style={card}>
        <h2 style={{ fontSize: "1rem", marginTop: 0 }}>Coordonnées</h2>
        <p style={{ margin: 0 }}>
          {BUSINESS.street}
          <br />
          {BUSINESS.postalCode} {BUSINESS.city}
          <br />
          <a href="tel:+33243123456">{BUSINESS.telephone}</a>
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>Horaires</strong>
          <br />
          Du lundi au vendredi : 8h–12h et 14h–18h
          <br />
          Samedi : 9h–12h
        </p>
      </section>

      <h2>Questions fréquentes</h2>
      <dl>
        {QUESTIONS.map((entry) => (
          <div key={entry.question}>
            <dt style={{ fontWeight: 600 }}>{entry.question}</dt>
            <dd style={{ marginBottom: "1rem", marginLeft: 0 }}>{entry.answer}</dd>
          </div>
        ))}
      </dl>

      <h2>Contrôle du balisage</h2>
      <p>
        <strong>{report.valid ? "Valide" : "Invalide"}</strong> — {report.errors.length} erreur(s),{" "}
        {report.warnings.length} avertissement(s).
      </p>
      {report.errors.length + report.warnings.length > 0 && (
        <ul>
          {[...report.errors, ...report.warnings].map((issue) => (
            <li key={`${issue.code}-${issue.property}-${issue.nodeId ?? ""}`}>
              <code>{issue.code}</code> — {issue.message}
            </li>
          ))}
        </ul>
      )}

      <h2>Le JSON-LD produit</h2>
      <p>
        C'est exactement ce que contient la balise <code>&lt;script&gt;</code> de cette page, à
        l'indentation près.
      </p>
      <pre
        style={{
          background: "#18181b",
          borderRadius: "0.5rem",
          color: "#f4f4f5",
          fontSize: "0.8rem",
          overflowX: "auto",
          padding: "1rem",
        }}
      >
        {serialize(jsonLd, { space: 2 })}
      </pre>
    </main>
  );
}
