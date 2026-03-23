"use client";

import React from "react";

export function HomeRedirect({ to }: { to: string }) {
  React.useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
}
