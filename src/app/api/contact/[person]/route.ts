import { NextResponse } from "next/server";

// WhatsApp numbers live server-side only. The About page links to
// /api/contact/<person>, so the numbers never appear in the page HTML
// where scrapers and bots would harvest them.
const WHATSAPP: Record<string, string> = {
  bahaa: "79964921960",
  tarek: "201102888141",
};

export async function GET(_request: Request, { params }: { params: Promise<{ person: string }> }) {
  const { person } = await params;
  const number = WHATSAPP[person.toLowerCase()];

  if (!number) {
    return NextResponse.json(
      { success: false, error: { message: "Unknown contact" } },
      { status: 404 }
    );
  }

  return NextResponse.redirect(`https://wa.me/${number}`, 307);
}
