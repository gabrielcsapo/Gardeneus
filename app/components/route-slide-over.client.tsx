"use client";

import React from "react";
import { useRouter, useParams } from "react-flight-router/client";
import { SlideOverPanel } from "./slide-over-panel.client.tsx";

export function RouteSlideOver({
  title,
  children,
  width = "w-[640px]",
}: {
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  const [open, setOpen] = React.useState(true);
  const router = useRouter();
  const params = useParams();

  function handleClose() {
    setOpen(false);
    // Navigate back to the yard after animation
    setTimeout(() => {
      router.navigate(`/yard/${params.id}`);
    }, 200);
  }

  return (
    <SlideOverPanel open={open} onClose={handleClose} title={title} width={width}>
      {children}
    </SlideOverPanel>
  );
}
