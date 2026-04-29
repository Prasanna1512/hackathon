import "@/styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FieldMedic AI — Emergency Triage Support",
  description: "AMD-powered multimodal emergency triage agent for first responders",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
