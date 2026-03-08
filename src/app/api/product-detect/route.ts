export const runtime = "nodejs";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Look at this product packaging image.

              Return JSON with:
- name: Brand + Product Name + Variant
- description: a short 1–3 sentence product description in Indonesian.

Rules:
- Use the brand visible on the package
- Keep description under 300 characters
- Do not invent ingredients not visible on packaging

Example:
{
"name": "Indomie Mi Goreng Rendang",
"description": "Indomie Goreng Rendang adalah varian mi instan goreng premium yang menghadirkan cita rasa autentik bumbu rendang khas Padang dengan aroma rempah kuat dan gurih. Produk ini populer karena tekstur mi kenyal, tersedia dalam ukuran reguler (91g) dan jumbo, serta dilengkapi taburan bumbu rendang, menjadikannya salah satu varian favorit."
}

Common Indonesian brands include:
Indomie, Mie Sedaap, ABC, Ultra Milk, Teh Botol Sosro, Pocari Sweat, Aqua, Le Minerale, Good Day, Kapal Api, Roma, SilverQueen, Tango, Chitato, Qtela, Terea, Lays, Pringles, Cheetos, Doritos, KitKat, Oreo, Lotte, Glico, Marimas, Energen, Bear Brand, Frisian Flag, Indomilk, Greenfields, Cimory.

If a brand from this list appears on the packaging, use it.

Return ONLY the name.`,
            },
            {
              type: "input_image",
              image_url: `data:${file.type};base64,${base64}`,
              detail: "low",
            },
          ],
        },
      ],
    });

    const text = response.output_text?.trim() || "";
    const parsed = JSON.parse(text);

    return Response.json({
    name: parsed.name,
    description: parsed.description
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Detection failed" }, { status: 500 });
  }
}