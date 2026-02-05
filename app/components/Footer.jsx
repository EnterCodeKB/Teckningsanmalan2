"use client";

import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div>
            <h3 className={styles.h3}>Auxesis Pharma Holding AB (publ)</h3>
            <p className={styles.small}>Org.nr: 559195-6486</p>
          </div>

          <div>
            <h3 className={styles.h3}>Juridisk information</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/privacy" className={styles.link}>
                  Integritetspolicy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={styles.h3}>GDPR & Dataskydd</h3>
            <p className={styles.small}>
              Vi följer GDPR och behandlar dina personuppgifter säkert. Läs mer
              i vår integritetspolicy.
            </p>
          </div>
        </div>

        <div className={styles.separator} />

        <div className={styles.copy}>
          <p>
            © {new Date().getFullYear()} Auxesis Pharma Holding AB (publ). Alla
            rättigheter förbehållna.
          </p>
        </div>
      </div>
    </footer>
  );
}
