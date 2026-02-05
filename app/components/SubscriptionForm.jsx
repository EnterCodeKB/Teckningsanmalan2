"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import { Checkbox } from "../components/ui/Checkbox";

import { CheckCircle2, Download } from "lucide-react";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import styles from "./SubscriptionForm.module.css";

// Om du hellre vill importera bilden som modul, byt till:
// import websiteQR from "@/assets/website-qr.png";
const websiteQR = "/website-qr.png";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mzzkeobb";

const PRICE_PER_SHARE = 82;

const formSchema = z.object({
  shares: z
    .string()
    .min(1, "Antal aktier måste anges")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Ange ett giltigt antal aktier"
    ),
  personalNumber: z
    .string()
    .min(10, "Personnummer/org.nummer måste vara minst 10 siffror")
    .max(13, "Personnummer/org.nummer får vara max 13 tecken"),
  name: z.string().min(2, "Namn måste anges").max(100),
  address: z.string().min(5, "Adress måste anges").max(200),
  postalCode: z
    .string()
    .min(5, "Postnummer måste anges")
    .max(10, "Postnummer får vara max 10 tecken"),
  city: z.string().min(2, "Postort måste anges").max(100),
  email: z.string().email("Ogiltig e-postadress"),
  phone: z
    .string()
    .min(8, "Telefonnummer måste vara minst 8 siffror")
    .max(20, "Telefonnummer måste vara max 20 tecken"),
  accountNumber: z.string().min(5, "Depå/AF konto måste anges").max(50),
  bankInstitution: z.string().min(2, "Bank/Institution måste anges").max(100),
  signatureCity: z.string().min(2, "Ort måste anges").max(100),
  signatureDate: z.string().min(1, "Datum måste anges"),
  signatureName: z.string().min(2, "Underskrift (köpare) måste anges").max(100),
  gdprConsent: z.literal(true, {
    errorMap: () => ({
      message: "Du måste godkänna behandling av personuppgifter enligt GDPR",
    }),
  }),
  acceptance: z.literal(true, {
    errorMap: () => ({
      message: "Du måste godkänna villkoren för att gå vidare",
    }),
  }),
});

// (Används ej just nu, men låter den ligga kvar om du vill använda senare)
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result || "";
      const base64 = result.toString().split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export default function SubscriptionForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const confirmationRef = useRef(null);
  const [hasSentPdfToBackend, setHasSentPdfToBackend] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shares: "",
      personalNumber: "",
      name: "",
      address: "",
      postalCode: "",
      city: "",
      email: "",
      phone: "",
      accountNumber: "",
      bankInstitution: "",
      signatureCity: "",
      signatureDate: new Date().toISOString().split("T")[0],
      signatureName: "",
      gdprConsent: false,
      acceptance: false,
    },
  });

  const shares = form.watch("shares");
  const totalAmount = useMemo(
    () => (shares ? Number(shares) * PRICE_PER_SHARE : 0),
    [shares]
  );

  const onSubmit = async (data) => {
    setSubmittedData(data);
    setIsSubmitted(true);
    setHasSentPdfToBackend(false); // reset vid ny submit

    const totalAmountForMail = data.shares
      ? Number(data.shares) * PRICE_PER_SHARE
      : 0;

    toast.success("Teckningsanmälan mottagen!", {
      description: "Din anmälan har registrerats.",
    });

    // Skicka data (utan PDF) till Formspree
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          formName: "Auxesis Teckningsanmälan",
          ...data,
          totalAmount: totalAmountForMail,
        }),
      });

      if (!res.ok) {
        console.error("Formspree error", await res.text());
        toast.error(
          "Formuläret är registrerat, men e-postbekräftelsen kunde inte skickas."
        );
      }
    } catch (error) {
      console.error("Kunde inte skicka e-post via Formspree:", error);
      toast.error(
        "Formuläret är registrerat, men e-postbekräftelsen kunde inte skickas."
      );
    }
  };

  // Generera PDF som blob + filnamn (samma layout som kunden ser)
  // Generera PDF som blob + filnamn (samma layout som kunden ser)
  const generatePdfBlob = async () => {
    if (!confirmationRef.current || !submittedData) return null;

    // säkra att bilder hunnit ladda
    const images = confirmationRef.current.getElementsByTagName("img");
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    // 🔹 Viktigt: håll nere scale så PDF:en inte blir för stor
    const canvas = await html2canvas(confirmationRef.current, {
      scale: 1.4, // mindre = mindre fil
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      imageTimeout: 0,
      scrollY: -window.scrollY,
    });

    const imgWidth = 210; // A4 bredd i mm
    const pageHeight = 297; // A4 höjd i mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF("p", "mm", "a4");

    // 🔹 Viktigt: använd JPEG + komprimering, inte PNG
    const imgData = canvas.toDataURL("image/jpeg", 0.75); // 0–1 = kvalitet

    if (imgHeight > pageHeight) {
      const scale = pageHeight / imgHeight;
      const scaledWidth = imgWidth * scale;
      const xOffset = (imgWidth - scaledWidth) / 2;
      pdf.addImage(imgData, "JPEG", xOffset, 0, scaledWidth, pageHeight);
    } else {
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    }

    const pn = submittedData?.personalNumber?.replace(/\D+/g, "") || "kvitto";
    const filename = `Teckningsanmalan_${pn}.pdf`;

    // 🔹 jsPDF komprimerar, men vi kör vanlig blob
    const blob = pdf.output("blob");

    return { blob, filename };
  };

  // PDF till kunden (nedladdning)
  const handleDownloadPDF = async () => {
    try {
      toast.loading("Förbereder PDF…");

      const result = await generatePdfBlob();
      if (!result) {
        toast.dismiss();
        toast.error("Kunde inte generera PDF.");
        return;
      }

      const { blob, filename } = result;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("PDF nedladdad!");
    } catch (error) {
      console.error("PDF-fel:", error);
      toast.dismiss();
      toast.error("Kunde inte generera PDF. Försök igen.");
    }
  };

  // Skicka PDF + data till din backend (/api/send-pdf)
  const sendPdfToBackend = async () => {
    try {
      const result = await generatePdfBlob();
      if (!result) return;

      const { blob, filename } = result;

      const formData = new FormData();
      formData.append("pdf", blob, filename);
      formData.append("meta", JSON.stringify(submittedData));

      const res = await fetch("/api/send-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorText = "";
        try {
          errorText = await res.text();
        } catch (e) {
          errorText = "(kunde inte läsa feltext)";
        }

        console.error("send-pdf API error", errorText);
        toast.error(
          "PDF är skapad, men kunde inte skickas automatiskt till bolaget."
        );
        return;
      }

      setHasSentPdfToBackend(true);
    } catch (err) {
      console.error("Kunde inte skicka PDF till backend:", err);
      toast.error(
        "PDF är skapad, men kunde inte skickas automatiskt till bolaget."
      );
    }
  };

  // När kvittot visas första gången → skicka PDF i bakgrunden till /api/send-pdf
  useEffect(() => {
    if (
      isSubmitted &&
      submittedData &&
      confirmationRef.current &&
      !hasSentPdfToBackend
    ) {
      sendPdfToBackend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isSubmitted,
    submittedData,
    confirmationRef.current,
    hasSentPdfToBackend,
  ]);

  // ====== KVITTO / AVRÄKNINGSNOTA (efter submit) ======
  if (isSubmitted && submittedData) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <Card ref={confirmationRef} className={styles.card}>
            <CardHeader className={styles.headerCenter}>
              <div className={styles.successBadge}>
                <CheckCircle2 className={styles.successIcon} />
              </div>
              <CardTitle className={styles.gradientTitle}>
                Tack för din anmälan!
              </CardTitle>
              <CardDescription className={styles.cardDescription}>
                Din teckningsanmälan har mottagits och behandlas nu.
              </CardDescription>
            </CardHeader>

            <CardContent className={styles.content}>
              {/* Sammanfattning / Avräkningsnota */}
              <div className={styles.boxMuted}>
                <h3 className={styles.boxTitle}>
                  Avräkningsnota – väntar underskrift av Auxesis Pharma Holding
                  AB (publ)
                </h3>
                <p className={styles.mutedTextTiny}>
                  Detta dokument är en avräkningsnota och inväntar formell
                  underskrift av Auxesis Pharma Holding AB (publ). När
                  avräkningsnotan har granskats och undertecknats av säljaren
                  skickas den tillbaka till köparen som bekräftelse på affären.
                </p>
                <Separator className={styles.sep} />
                <div className={styles.summaryGrid}>
                  <div className={styles.rowBetween}>
                    <span className={styles.mutedText}>Antal B-aktier:</span>
                    <span className={styles.valueText}>
                      {submittedData?.shares || ""} st
                    </span>
                  </div>
                  <div className={styles.rowBetween}>
                    <span className={styles.mutedText}>Pris per aktie:</span>
                    <span className={styles.valueText}>
                      {PRICE_PER_SHARE} SEK
                    </span>
                  </div>
                  <Separator className={styles.sep} />
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>
                      Total köpeskilling:
                    </span>
                    <span className={styles.totalValue}>
                      {totalAmount.toLocaleString("sv-SE")} SEK
                    </span>
                  </div>
                </div>
              </div>

              {/* Betalningsinfo + varning */}
              <div className={styles.boxAccent}>
                <h4 className={styles.sectionTitle}>Betalningsinformation</h4>
                <div className={styles.paymentWrap}>
                  <div className={styles.paymentCard}>
                    <p className={styles.paymentHint}>
                      SEB – Emissionskonto (Bankgiro):
                    </p>
                    <p className={styles.bgNumber}>771-2375</p>
                    <Separator className={styles.sepTight} />
                    <div className={styles.paymentFacts}>
                      <p className={styles.mutedTextSmall}>
                        Mottagare:{" "}
                        <span className={styles.strong}>
                          AUXESIS PHARMA HOLDING AB (publ)
                        </span>
                      </p>
                      <p className={styles.mutedTextSmall}>
                        Org.nr:{" "}
                        <span className={styles.strong}>559195-6486</span>
                      </p>
                    </div>

                    <div className={styles.amountPanel}>
                      <p className={styles.mutedTextTiny}>
                        Sammanlagd köpeskilling
                      </p>
                      <p className={styles.mutedTextTiny}>Belopp:</p>
                      <p className={styles.amountBig}>
                        {totalAmount.toLocaleString("sv-SE")} SEK
                      </p>
                    </div>
                  </div>

                  <div className={styles.warningBox}>
                    <div className={styles.warningGrid}>
                      <div>
                        <p className={styles.warningTitle}>
                          ▲ Viktiga betalningsvillkor:
                        </p>
                        <ul className={styles.warningList}>
                          <li>
                            Betalning för tecknade B-aktier ska ske{" "}
                            <span className={styles.strong}>kontant</span>
                          </li>
                          <li>
                            Likviden ska sättas in{" "}
                            <span className={styles.strong}>
                              senast fem (5) bankdagar
                            </span>{" "}
                            efter signering
                          </li>
                          <li>
                            <span className={styles.strong}>Observera:</span>{" "}
                            Onoterade aktier kan INTE placeras på ISK-konto
                          </li>
                          <li>
                            Endast{" "}
                            <span className={styles.strong}>
                              AF- eller VP-konto
                            </span>{" "}
                            är tillåtet
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <p className={styles.mutedTextTiny}>
                    Säljaren bekräftar efter mottagen likvid att köparen innehar
                    B-aktierna med full och oinskränkt äganderätt och att
                    aktierna inte belastas av panträtt, optionsrätt eller andra
                    förfoganderättsinskränkningar.
                  </p>
                </div>
              </div>

              {/* Dina uppgifter */}
              <div className={styles.boxMuted}>
                <h4 className={styles.sectionTitle}>Dina uppgifter</h4>
                <div className={styles.twoColGrid}>
                  <div className={styles.rowBetween}>
                    <span className={styles.mutedText}>Namn:</span>
                    <span className={styles.valueText}>
                      {submittedData?.name || ""}
                    </span>
                  </div>
                  <div className={styles.rowBetween}>
                    <span className={styles.mutedText}>Personnr/Org.nr:</span>
                    <span className={styles.valueText}>
                      {submittedData?.personalNumber || ""}
                    </span>
                  </div>
                  <div className={styles.rowBetween}>
                    <span className={styles.mutedText}>E-post:</span>
                    <span className={styles.valueText}>
                      {submittedData?.email || ""}
                    </span>
                  </div>
                  <div className={styles.rowBetween}>
                    <span className={styles.mutedText}>Telefon:</span>
                    <span className={styles.valueText}>
                      {submittedData?.phone || ""}
                    </span>
                  </div>
                  <div className={styles.fullRow}>
                    <span className={styles.mutedText}>Adress:</span>
                    <div className={styles.valueText}>
                      {submittedData?.address || ""},{" "}
                      {submittedData?.postalCode || ""}{" "}
                      {submittedData?.city || ""}
                    </div>
                  </div>
                  <div className={styles.rowBetween}>
                    <span className={styles.mutedText}>Depå/AF-konto:</span>
                    <span className={styles.valueText}>
                      {submittedData?.accountNumber || ""}
                    </span>
                  </div>
                  <div className={styles.rowBetween}>
                    <span className={styles.mutedText}>Bank/Institution:</span>
                    <span className={styles.valueText}>
                      {submittedData?.bankInstitution || ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Underskrift – köpare + QR + avräkningsdel */}
              <div className={styles.boxMutedBorderTop}>
                <h4 className={styles.sectionTitle}>Underskrift</h4>

                {/* Köparens uppgifter */}
                <div className={styles.signatureGrid}>
                  <div className={styles.rowBetween}>
                    <span className={styles.mutedText}>Ort:</span>
                    <span className={styles.valueText}>
                      {submittedData?.signatureCity || ""}
                    </span>
                  </div>
                  <div className={styles.rowBetween}>
                    <span className={styles.mutedText}>Datum:</span>
                    <span className={styles.valueText}>
                      {submittedData?.signatureDate || ""}
                    </span>
                  </div>
                  <div className={styles.rowBetween}>
                    <span className={styles.mutedText}>Köpare:</span>
                    <span
                      className={styles.valueText}
                      style={{ fontStyle: "italic" }}
                    >
                      {submittedData?.signatureName || ""}
                    </span>
                  </div>
                </div>

                {/* Digital signering + QR */}
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--muted-foreground)",
                      fontStyle: "italic",
                      flex: 1,
                    }}
                  >
                    Jag bekräftar härmed min avsikt att teckna B-aktier enligt
                    ovan och att avtalet blir bindande först när betalning har
                    mottagits av bolaget.
                    <br />
                    <strong style={{ color: "var(--foreground)" }}>
                      Digital signering:
                    </strong>{" "}
                    {submittedData?.signatureName || ""} (
                    {submittedData?.email || ""}) –{" "}
                    {new Date().toLocaleDateString("sv-SE")}
                  </p>
                  <div style={{ flexShrink: 0 }}></div>
                </div>

                {/* Ny avräkningsnota-del för underskrift (köpare + säljare) */}
                <div className={styles.settlementSignature}>
                  <div className={styles.settlementRowHeader}>
                    <span>Ort och datum</span>
                    <span>Ort och datum</span>
                  </div>

                  <div className={styles.settlementRow}>
                    {/* Köpare */}
                    <div>
                      <div className={styles.settlementValue}>
                        {submittedData?.signatureCity || ""},{" "}
                        {submittedData?.signatureDate || ""}
                      </div>
                      <div className={styles.signatureLine} />
                      <div className={styles.signatureLabel}>Köpare</div>
                    </div>

                    {/* Säljare */}
                    <div>
                      <div className={styles.settlementValue}>STOCKHOLM</div>
                      <div className={styles.signatureLine} />
                      <div className={styles.signatureLabel}>
                        Namnteckning, säljare
                      </div>
                      <div className={styles.signatureName}>ROAR ADELSTEN</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kontaktblock i kvittot */}
              <div className={styles.receiptFoot}>
                <p className={styles.receiptFootText}>
                  <strong className={styles.textForeground}>
                    AUXESIS PHARMA HOLDING AB (publ)
                  </strong>
                  <br />
                  Org.nr: 559195-6486
                  <br />
                  Adress: Liljestrands väg 10, Fysiologen, 171 65 SOLNA
                  <br />
                  Telefon: 08-771 43 00 · E-post: auxesis@auxesispharma.com ·
                  Webb: auxesis.se
                </p>
              </div>
            </CardContent>
          </Card>

          {/* PDF-knappen ligger UTANFÖR kvittot */}
          <div className={styles.pdfButtonWrap}>
            <Button onClick={handleDownloadPDF} className={styles.printBtn}>
              <Download className={styles.downloadIcon} />
              Ladda ner PDF
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ====== FORM-läget (innan submit) ======
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Card className={styles.card}>
          <CardHeader className={styles.headerCenter}>
            <CardTitle className={styles.gradientTitle}>
              Teckningsanmälan Emission
            </CardTitle>
            <CardDescription className={styles.cardDescription}>
              Auxesis Pharma Holding AB (publ)
            </CardDescription>

            <div className={styles.banner}>
              <div>Teckning för B-aktier: 2025-11-15 till 2026-02-20</div>
              <div className={styles.bannerStrong}>
                Pris per B-aktie: {PRICE_PER_SHARE} SEK
              </div>
              <div className={styles.bannerTiny}>
                Emission av högst 300 000 B-aktier inom det beslutade totala
                mandatet om 1 000 000 B-aktier
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={styles.formSpace}
              >
                {/* Teckningsinfo */}
                <div>
                  <h3 className={styles.sectionH3}>Teckningsinformation</h3>
                  <FormField
                    control={form.control}
                    name="shares"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Antal B-aktier att teckna</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ange antal aktier"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className={styles.helpText}>
                          Max 300 000 aktier tillgängliga i denna emission
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {totalAmount > 0 && (
                    <div className={styles.amountWrap}>
                      <div className={styles.amountCard}>
                        <p className={styles.mutedTextSmall}>
                          Sammanlagd köpeskilling
                        </p>
                        <p className={styles.mutedTextSmall}>Belopp:</p>
                        <p className={styles.amountMed}>
                          {totalAmount.toLocaleString("sv-SE")} SEK
                        </p>
                      </div>

                      <div className={styles.paymentInfo}>
                        <h4 className={styles.infoTitle}>
                          Betalningsinformation
                        </h4>
                        <div className={styles.paymentGrid}>
                          <div className={styles.paymentCard}>
                            <p className={styles.paymentHint}>
                              SEB – Emissionskonto (Bankgiro):
                            </p>
                            <p className={styles.bgNumber}>771-2375</p>
                            <Separator className={styles.sepTight} />
                            <div className={styles.paymentFacts}>
                              <p className={styles.mutedTextSmall}>
                                Mottagare:{" "}
                                <span className={styles.strong}>
                                  AUXESIS PHARMA HOLDING AB (publ)
                                </span>
                              </p>
                              <p className={styles.mutedTextSmall}>
                                Org.nr:{" "}
                                <span className={styles.strong}>
                                  559195-6486
                                </span>
                              </p>
                              <p className={styles.mutedTextSmall}>
                                Belopp:{" "}
                                <span className={styles.strong}>
                                  {totalAmount.toLocaleString("sv-SE")} SEK
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={styles.warningMini}>
                          <p className={styles.warningMiniTitle}>
                            ⚠️ Betalning senast 5 bankdagar efter signering
                          </p>
                          <p className={styles.mutedTextTiny}>
                            Obs: Onoterade aktier kan INTE placeras på ISK-konto
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className={styles.sep} />

                {/* Köparinformation */}
                <div>
                  <h3 className={styles.sectionH3}>Köparinformation</h3>
                  <div className={styles.grid2}>
                    <FormField
                      control={form.control}
                      name="personalNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personnummer/Org.nummer</FormLabel>
                          <FormControl>
                            <Input placeholder="YYYYMMDD-XXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Namn</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="För- och efternamn"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-post</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="din@epost.se"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="070-123 45 67"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className={styles.sep} />

                {/* Adressinformation */}
                <div>
                  <h3 className={styles.sectionH3}>Adressinformation</h3>
                  <div className={styles.grid2}>
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className={styles.span2}>
                          <FormLabel>Adress</FormLabel>
                          <FormControl>
                            <Input placeholder="Gatuadress" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postnummer</FormLabel>
                          <FormControl>
                            <Input placeholder="123 45" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postort</FormLabel>
                          <FormControl>
                            <Input placeholder="Stockholm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className={styles.sep} />

                {/* Konto */}
                <div>
                  <h3 className={styles.sectionH3}>Kontoinformation</h3>
                  <div className={styles.grid2}>
                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Depå/AF-konto (Ej ISK)</FormLabel>
                          <FormControl>
                            <Input placeholder="Kontonummer" {...field} />
                          </FormControl>
                          <FormDescription className={styles.hintTiny}>
                            Onoterade aktier kan endast placeras på AF- eller
                            VP-konto
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bankInstitution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank/Institution</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Bank eller Institution"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className={styles.sep} />

                {/* Underskrift (form-fält) */}
                <div>
                  <h3 className={styles.sectionH3}>Underskrift</h3>
                  <div className={styles.grid3}>
                    <FormField
                      control={form.control}
                      name="signatureCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ort</FormLabel>
                          <FormControl>
                            <Input placeholder="Stockholm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="signatureDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Datum</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="signatureName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Köpare (underskrift)</FormLabel>
                          <FormControl>
                            <Input placeholder="Fullständigt namn" {...field} />
                          </FormControl>
                          <FormDescription className={styles.hintTiny}>
                            Skriv ditt fullständigt namn som underskrift
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Info-block + villkor */}
                <div className={styles.infoBox}>
                  <p className={styles.infoTitle}>
                    Viktig information och bekräftelse:
                  </p>
                  <div className={styles.infoText}>
                    <p>
                      Genom undertecknande av denna teckningsanmälan bekräftas
                      det att jag/vi tagit del av information och önskar teckna
                      B-aktier i Auxesis Pharma Holding AB (publ).
                    </p>
                    <p>
                      När betalningen har mottagits upprättas en avräkningsnota
                      som bekräftelse på genomförd affär och hanteras inom ramen
                      för bolagets aktiebok och ägarregistrering.
                    </p>
                    <p>
                      Säljaren bekräftar efter mottagen likvid att köparen
                      innehar B-aktierna med full och oinskränkt äganderätt och
                      att aktierna inte belastas av panträtt, optionsrätt eller
                      andra förfoganderättsinskränkningar.
                    </p>
                    <p className={styles.strong}>
                      Köpare innehar full sälj/äganderätt på sina B-aktier efter
                      erlagd likvid.
                    </p>
                  </div>

                  <div className={styles.infoDivider}>
                    <p className={styles.infoSubtitle}>Betalningsvillkor:</p>
                    <ul className={styles.ulTiny}>
                      <li>
                        Betalning ska ske{" "}
                        <span className={styles.strong}>kontant</span> genom att
                        likviden sätts in på bolagets emissionskonto
                      </li>
                      <li>
                        Betalning ska ske{" "}
                        <span className={styles.strong}>
                          senast fem (5) bankdagar
                        </span>{" "}
                        efter signering av teckningsanmälan
                      </li>
                      <li>
                        <span className={styles.strong}>Observera:</span>{" "}
                        Onoterade aktier kan INTE placeras på ISK-konto. Endast
                        AF- eller VP-konto.
                      </li>
                    </ul>
                  </div>

                  <div className={styles.payPanel}>
                    <p className={styles.mutedTextTiny}>
                      SEB – Emissionskonto (Bankgiro)
                    </p>
                    <p className={styles.bgNumberSm}>771-2375</p>
                    <p className={styles.mutedTextTiny}>
                      Mottagare: AUXESIS PHARMA HOLDING AB (publ)
                    </p>
                  </div>
                </div>

                {/* GDPR & Acceptance */}
                <div className={styles.infoBox}>
                  <FormField
                    control={form.control}
                    name="gdprConsent"
                    render={({ field }) => (
                      <FormItem>
                        <div className={styles.checkboxRow}>
                          <FormControl>
                            <Checkbox
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                              aria-label="GDPR-samtycke"
                            />
                          </FormControl>
                          <div>
                            <FormLabel className={styles.sectionLabel}>
                              Jag samtycker till behandling av mina
                              personuppgifter enligt GDPR
                            </FormLabel>
                            <FormDescription className={styles.mutedTextSmall}>
                              Jag samtycker till att Auxesis Pharma Holding AB
                              (publ) behandlar mina personuppgifter i enlighet
                              med{" "}
                              <a
                                href="/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                              >
                                integritetspolicyn
                              </a>{" "}
                              för att hantera min teckningsanmälan och
                              aktieinnehav. Uppgifterna används för att fullgöra
                              avtalet och uppfylla rättsliga förpliktelser
                              enligt aktiebolagslagen.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Separator className={styles.sep} />

                  <FormField
                    control={form.control}
                    name="acceptance"
                    render={({ field }) => (
                      <FormItem>
                        <div className={styles.checkboxRow}>
                          <FormControl>
                            <Checkbox
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                              aria-label="Godkännande villkor"
                            />
                          </FormControl>
                          <div>
                            <FormLabel className={styles.sectionLabel}>
                              Jag godkänner villkoren och bekräftar att
                              informationen är korrekt.
                            </FormLabel>
                            <FormDescription className={styles.mutedTextSmall}>
                              Genom att kryssa i denna ruta godkänner jag att
                              den information jag har lämnat är korrekt och att
                              jag accepterar villkoren för teckning av B-aktier
                              i Auxesis Pharma Holding AB (publ). Detta utgör
                              min digitala signatur och bekräftelse.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className={styles.submitBtn}>
                  Bekräfta och gå vidare
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Foot under formuläret */}
        <div className={styles.foot}>
          <div className={styles.company}>AUXESIS PHARMA HOLDING AB (publ)</div>
          <div className={styles.tiny}>Org.nr: 559195-6486</div>
          <div className={styles.contact}>
            <p>Adress: Liljestrands väg 10, Fysiologen, 171 65 SOLNA</p>
            <p>Telefon: 08-771 43 00 · E-post: auxesis@auxesispharma.com</p>
            <p>Webb: auxesis.se</p>
          </div>
          <div className={styles.tinyNote}>
            För frågor om emissionen eller teknisk support, kontakta oss via
            e-post eller telefon.
          </div>
        </div>
      </div>
    </div>
  );
}
