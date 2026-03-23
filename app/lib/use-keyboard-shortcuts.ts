import React from "react";
import { SHAPE_TYPES } from "./shapes.ts";
import type { ToolType, YardElement } from "./yard-types.ts";

const TOOL_SHORTCUTS: Record<string, ToolType> = {
  v: "select",
  h: "hand",
  "1": "rectangle",
  "2": "circle",
  "3": "keyhole",
  "4": "spiral",
  "5": "hugelkultur",
  "6": "mandala",
  "7": "container",
  "8": "path",
  "9": "structure",
  "0": "water",
};

export function useKeyboardShortcuts({
  selectedId,
  elements,
  activeTool,
  setActiveTool,
  setSelectedId,
  onDelete,
  onDuplicate,
  onMove,
  onPanCanvas,
  onUndo,
  onRedo,
  onCloseAll,
}: {
  selectedId: number | null;
  elements: YardElement[];
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  setSelectedId: (id: number | null) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onMove: (id: number, dx: number, dy: number) => void;
  onPanCanvas: (dx: number, dy: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCloseAll: () => void;
}) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;

      // Tool shortcuts (only without modifiers)
      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        const tool = TOOL_SHORTCUTS[e.key.toLowerCase()];
        if (tool) {
          e.preventDefault();
          setActiveTool(tool);
          return;
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          e.preventDefault();
          onDelete(selectedId);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        onRedo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        if (selectedId) onDuplicate(selectedId);
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const dx = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        const dy = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
        if (selectedId) {
          onMove(selectedId, dx, dy);
        } else {
          onPanCanvas(dx, dy);
        }
      }
      if (e.key === "Escape") {
        onCloseAll();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, elements, activeTool, onPanCanvas]);
}
