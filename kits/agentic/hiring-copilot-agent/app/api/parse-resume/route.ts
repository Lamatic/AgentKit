import OpenAI from "openai";

const client = new OpenAI();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await client.files.create({
      file: new File([buffer], file.name, { type: file.type }),
      purpose: "user_data",
    });

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              file_id: uploaded.id,
            },
            {
              type: "input_text",
              text: `
Extract structured resume data in JSON:

{
  "name": "",
  "skills": [],
  "experience_years": number,
  "projects": [{name: "", skills_gained:[""]}],
  "education": "",
  "email": "",
  "certificates": []
}

IMPORTANT:
- Extract skills from projects and experience also
- Do NOT hallucinate
- Return only JSON
`,
            },
          ],
        },
      ],
    });

    const text = response.output_text;

    return Response.json({ parsed: text });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Parsing failed" }, { status: 500 });
  }
}
