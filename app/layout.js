import "./globals.css";

export const metadata = {
  title: "Fresco Forum",
  description: "Where students argue about art and politics — in public, under their own name.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body">{children}</body>
    </html>
  );
}
