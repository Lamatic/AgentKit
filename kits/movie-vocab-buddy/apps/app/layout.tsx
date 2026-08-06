import "./globals.css";
import Nav from "../components/Nav";

export const metadata = {
  title: "Movie Vocab Buddy",
  description: "Learn English vocabulary from the movies and shows you watch.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
