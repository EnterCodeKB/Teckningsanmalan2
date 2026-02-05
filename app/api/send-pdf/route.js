// app/api/send-pdf/route.js
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const formData = await req.formData();

    const file = formData.get("pdf");
    const metaRaw = formData.get("meta");
    const meta = metaRaw ? JSON.parse(metaRaw) : null;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Ingen PDF mottagen" },
        { status: 400 }
      );
    }

    // Gör om filen till Buffer för Resend
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    const filename = file.name || "Teckningsanmalan.pdf";

    const subject = `Teckningsanmälan – ${meta?.name || "okänd köpare"} – ${
      meta?.shares || ""
    } B-aktier`;

    const textBody = `
En ny teckningsanmälan har skickats in via webbformuläret.

Namn: ${meta?.name ?? "-"}
Personnr/Org.nr: ${meta?.personalNumber ?? "-"}
E-post: ${meta?.email ?? "-"}
Telefon: ${meta?.phone ?? "-"}
Antal B-aktier: ${meta?.shares ?? "-"}
Totalbelopp: ${meta?.totalAmount ?? "-"} SEK
`;

    const { error } = await resend.emails.send({
      // 👇 NU använder vi ditt verifierade Auxesis-domän
      from: "Auxesis Emission <no-reply@auxesispharma.com>",
      to: ["auxesis@auxesispharma.com"],
      // svara gärna till köparen:
      reply_to: meta?.email || "auxesis@auxesispharma.com",
      subject,
      text: textBody,
      attachments: [
        {
          filename,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("Resend error", error);
      return NextResponse.json(
        { error: "Resend error", message: String(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-pdf route error", err);
    return NextResponse.json(
      { error: "Server error", message: String(err) },
      { status: 500 }
    );
  }
}
