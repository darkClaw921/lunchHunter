"use client";

import * as React from "react";
import { CompareButton } from "@/components/compare/CompareButton";
import type { CompareLunch } from "@/lib/compare/CompareContext";

interface DetailCompareButtonProps {
  lunch: CompareLunch;
}

export function DetailCompareButton({
  lunch,
}: DetailCompareButtonProps): React.JSX.Element {
  return <CompareButton lunch={lunch} variant="floating" />;
}
