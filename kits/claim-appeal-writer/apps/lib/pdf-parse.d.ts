declare module "pdf-parse/lib/pdf-parse.js" {
  const pdfParse: (data: Buffer, options?: Record<string, unknown>) => Promise<{ text: string; numpages: number }>;
  export default pdfParse;
}
