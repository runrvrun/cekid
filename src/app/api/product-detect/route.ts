import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return Response.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Look at this product packaging image.

Return the full product name in this format:
Brand + Product Name + Variant

Examples:
Indomie Mi Goreng
Indome Mi Goreng Rasa Ayam Panggang Jumbo
Indomie Hype Abis Mie Nyemek Ala Banglahdes'e Rasa Kari
Coca Cola Zero Sugar
Oreo Chocolate Cream

Rules:
- Use the brand printed on the package
- Include variant if visible
- Return ONLY the product name
`,
            },
            {
              type: "input_image",
              image_url: imageUrl,
              detail: "auto",   // REQUIRED by SDK
            },
          ],
        },
      ],
    });

    const name = response.output_text?.trim();

    return Response.json({ name });

  } catch (err) {
    console.error("product-detect error", err);
    return Response.json({ error: "Detection failed" }, { status: 500 });
  }
}