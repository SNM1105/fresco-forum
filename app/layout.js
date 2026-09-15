import "./globals.css";

export const metadata = {
  title: "Screw Your Slop",
  description: "A student forum for making, thinking, and calling out lazy ideas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body">{children}</body>
    </html>
  );
}
