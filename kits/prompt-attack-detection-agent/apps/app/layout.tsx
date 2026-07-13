import "./globals.css";

export const metadata = {
    title: "PromptShield AI",
    description: "Prompt Attack Detection Agent"
};

export default function RootLayout({
    children,
}:{
    children:React.ReactNode
}){
    return(
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}