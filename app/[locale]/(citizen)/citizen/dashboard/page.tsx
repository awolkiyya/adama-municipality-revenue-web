import type { Metadata } from "next";
import CitizenDashboard from "@/components/citizen/CitizenDashboard";

export const metadata: Metadata = {
  title: "Galii Kiyya · Citizen Portal",
  description: "View invoices, make payments, and manage your citizen profile.",
};

export default function CitizenPortalPage() {
  return <CitizenDashboard />;
}
