import { ContourTransitionScreen } from "@/components/ui/contour-transition-screen";

export default function Loading() {
  return (
    <ContourTransitionScreen
      label="Opening Contour…"
      description="Resolving your secure workspace."
    />
  );
}
