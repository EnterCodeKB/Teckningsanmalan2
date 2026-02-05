"use client";

import Link from "next/link";
import styles from "./Privacy.module.css";
import Footer from "../components/Footer";

export default function PrivacyPage() {
  const updated = new Date().toLocaleDateString("sv-SE");

  return (
    <>
      <div className={styles.page}>
        <div className={styles.container}>
          <Link href="/" className={styles.backBtn}>
            <span className={styles.backIcon}>←</span> Tillbaka till
            teckningsanmälan
          </Link>

          <div className={styles.card}>
            <header className={styles.header}>
              <h1 className={styles.title}>Integritetspolicy</h1>
              <p className={styles.updated}>Senast uppdaterad: {updated}</p>
            </header>

            <div className={styles.prose}>
              <section>
                <h2 className={styles.sectionTitle}>
                  1. Personuppgiftsansvarig
                </h2>
                <p>
                  Auxesis Pharma Holding AB (publ), org.nr 559195-6486, är
                  personuppgiftsansvarig för behandlingen av dina
                  personuppgifter.
                </p>
              </section>

              <section>
                <h2 className={styles.sectionTitle}>
                  2. Vilka personuppgifter samlar vi in?
                </h2>
                <p>
                  Vi samlar in följande personuppgifter när du tecknar B-aktier:
                </p>
                <ul className={styles.ul}>
                  <li>Namn</li>
                  <li>Personnummer eller organisationsnummer</li>
                  <li>Adress (gatuadress, postnummer, postort)</li>
                  <li>E-postadress</li>
                  <li>Telefonnummer</li>
                  <li>Depå-/AF-kontonummer</li>
                  <li>Bank/Institution</li>
                  <li>Digital signatur och tidpunkt för teckning</li>
                </ul>
              </section>

              <section>
                <h2 className={styles.sectionTitle}>
                  3. Ändamål och rättslig grund
                </h2>
                <ul className={styles.ul}>
                  <li>
                    <strong>Fullgörande av avtal:</strong> Hantera
                    teckningsanmälan, registrera aktieägande och betalning.
                  </li>
                  <li>
                    <strong>Rättslig förpliktelse:</strong> Uppfylla krav enligt
                    aktiebolags- och bokföringslagen.
                  </li>
                  <li>
                    <strong>Berättigat intresse:</strong> Kontakt om
                    aktieinnehav och bolagshändelser.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className={styles.sectionTitle}>
                  4. Lagring av personuppgifter
                </h2>
                <p>
                  Uppgifter lagras så länge det krävs för ändamålen och
                  rättsliga krav. Aktieägaruppgifter sparas minst 7 år efter
                  transaktion.
                </p>
              </section>

              <section>
                <h2 className={styles.sectionTitle}>
                  5. Delning av personuppgifter
                </h2>
                <ul className={styles.ul}>
                  <li>Banker/finansiella institutioner för betalningar</li>
                  <li>VP-konton och relevanta bolag för registrering</li>
                  <li>Revisorer och juridiska rådgivare</li>
                  <li>Myndigheter enligt lag</li>
                </ul>
                <p>Vi överför inte personuppgifter utanför EU/EES.</p>
              </section>

              <section>
                <h2 className={styles.sectionTitle}>
                  6. Dina rättigheter (GDPR)
                </h2>
                <ul className={styles.ul}>
                  <li>
                    <strong>Tillgång</strong>, <strong>rättelse</strong>,{" "}
                    <strong>radering</strong>, <strong>begränsning</strong>
                  </li>
                  <li>
                    <strong>Dataportabilitet</strong> och{" "}
                    <strong>invändning</strong>
                  </li>
                </ul>
                <p>
                  <strong>OBS:</strong> Vissa rättigheter kan begränsas av
                  rättsliga förpliktelser.
                </p>
              </section>

              <section>
                <h2 className={styles.sectionTitle}>7. Säkerhet</h2>
                <p>
                  Vi använder lämpliga tekniska och organisatoriska åtgärder.
                  All data överförs krypterat och lagras säkert.
                </p>
              </section>

              <section>
                <h2 className={styles.sectionTitle}>8. Cookies</h2>
                <p>
                  Webbplatsen använder för närvarande inga cookies. Vid ändring
                  uppdateras policyn.
                </p>
              </section>

              <section>
                <h2 className={styles.sectionTitle}>9. Kontaktuppgifter</h2>
                <div className={styles.infoBox}>
                  <p className={styles.company}>
                    Auxesis Pharma Holding AB (publ)
                  </p>
                  <p className={styles.muted}>Org.nr: 559195-6486</p>
                  <p className={styles.muted}>
                    För frågor om personuppgiftsbehandling, kontakta oss via
                    e-post eller brev till bolagets adress.
                  </p>
                </div>
              </section>

              <section>
                <h2 className={styles.sectionTitle}>10. Klagomål</h2>
                <p>
                  Du kan lämna klagomål till Integritetsskyddsmyndigheten (IMY)
                  om du anser att GDPR överträtts.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
