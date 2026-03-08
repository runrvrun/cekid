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
Return the full product name in this format:
Brand + Product Name + Variant

Example:
Indomie Mi Goreng Rendang
Indomie Mi Goreng Rasa Ayam Panggang Jumbo
Indomie Hype Abis Mi Nyemek Banglahdes'e

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

    return Response.json({
      name: response.output_text?.trim(),
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Detection failed" }, { status: 500 });
  }
}