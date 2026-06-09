import Link from "next/link";
import Image from "next/image";

export default function Nav() {
  return (
    <nav className="w-full bg-[#050508]/60 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center sticky top-0 z-50 transition-colors duration-300 hover:bg-[#050508]/80">
      <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
        <Image
          src="/forge2.svg"
          alt="Forge Logo"
          width={28}
          height={28}
          className="object-contain"
        />
        <span className="text-xl font-bold text-text-primary tracking-wide">
          Forge
        </span>
      </Link>
    </nav>
  );
}
