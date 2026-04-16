import { Suspense } from "react";
import SuccessPageClient from "@/components/SuccessPageClient";

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessPageClient />
    </Suspense>
  );
}