import { readFile } from "node:fs/promises";
import path from "node:path";
import Header from "@/components/Header";
import ReleasePlanner from "@/components/ReleasePlanner";
import {
  initialSampleFile,
  presetDefinitions,
  type SqlPreset,
} from "@/lib/presets";

const fallbackSql = `ALTER TABLE users
ADD COLUMN last_seen TIMESTAMP;`;

async function readExampleSql(filename: string) {
  const filePath = path.join(
    process.cwd(),
    "..",
    "examples",
    "input",
    filename,
  );

  return readFile(filePath, "utf8");
}

export default async function Home() {
  const presets: SqlPreset[] = await Promise.all(
    presetDefinitions.map(async (preset) => ({
      ...preset,
      sql: await readExampleSql(preset.filename),
    })),
  );

  const initialSql =
    (await readExampleSql(initialSampleFile).catch(() => null)) ??
    presets[0]?.sql ??
    fallbackSql;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="grid-overlay absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-white/60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-slate-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-4 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-7">
        <Header />
        <ReleasePlanner initialSql={initialSql} presets={presets} />
      </div>
    </main>
  );
}
