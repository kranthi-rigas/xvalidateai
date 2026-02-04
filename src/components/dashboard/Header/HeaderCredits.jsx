import React from "react";
import { useContextElement } from "@/context/Context";
import { COLORS } from "@/styles/colors";

export default function HeaderCredits() {
  const { userCredits } = useContextElement();

  return (
    <div className="flex items-center px-3 py-1.5 rounded-lg border border-border bg-muted/50">
      <i 
        className="fa-solid fa-coins mr-2" 
        style={{ color: COLORS.secondary, fontSize: "16px" }}
      />
      <div className="flex items-baseline gap-1">
        <span 
          className="text-lg font-bold" 
          style={{ color: COLORS.secondary }}
        >
          {userCredits?.remaining ?? 0}
        </span>
        <span className="text-xs text-muted-foreground">
          / {userCredits?.total ?? 0}
        </span>
      </div>
      <span className="ml-2 text-xs text-muted-foreground font-medium">
        Credits
      </span>
    </div>
  );
}