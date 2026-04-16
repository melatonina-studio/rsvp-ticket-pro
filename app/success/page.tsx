import { Suspense } from "react";
import SuccessPageClient from "@/components/SuccessPageClient";

export default function SuccessPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Caricamento...</main>}>
      <SuccessPageClient />
    </Suspense>
  );
}