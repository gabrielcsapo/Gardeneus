"use server";

import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { yards, yardElements } from "../db/schema.ts";

export async function createYard(formData: FormData) {
  const name = formData.get("name") as string;
  const widthFt = Number(formData.get("widthFt"));
  const heightFt = Number(formData.get("heightFt"));

  if (!name || !widthFt || !heightFt) {
    throw new Error("Name, width, and height are required");
  }

  const result = await db
    .insert(yards)
    .values({ name, widthFt, heightFt })
    .returning({ id: yards.id });
  return result[0].id;
}

export async function updateYard(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const widthFt = Number(formData.get("widthFt"));
  const heightFt = Number(formData.get("heightFt"));

  await db.update(yards).set({ name, widthFt, heightFt }).where(eq(yards.id, id));
}

export async function deleteYard(formData: FormData) {
  const id = Number(formData.get("id"));
  await db.delete(yards).where(eq(yards.id, id));
}

export async function addYardElement(formData: FormData) {
  const yardId = Number(formData.get("yardId"));
  const shapeType = formData.get("shapeType") as string;
  const x = Number(formData.get("x"));
  const y = Number(formData.get("y"));
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));
  const label = (formData.get("label") as string) || null;
  const sunExposure = (formData.get("sunExposure") as string) || "full_sun";
  const rotation = Number(formData.get("rotation")) || 0;

  const result = await db.insert(yardElements).values({
    yardId,
    shapeType,
    x,
    y,
    width,
    height,
    label,
    sunExposure,
    rotation,
  }).returning({ id: yardElements.id });

  return result[0].id;
}

export async function updateYardElement(formData: FormData) {
  const id = Number(formData.get("id"));
  const updates: Record<string, unknown> = {};

  const x = formData.get("x");
  const y = formData.get("y");
  const width = formData.get("width");
  const height = formData.get("height");
  const label = formData.get("label");
  const sunExposure = formData.get("sunExposure");
  const shapeType = formData.get("shapeType");

  if (x != null) updates.x = Number(x);
  if (y != null) updates.y = Number(y);
  if (width != null) updates.width = Number(width);
  if (height != null) updates.height = Number(height);
  if (label != null) updates.label = label as string;
  if (sunExposure != null) updates.sunExposure = sunExposure as string;
  if (shapeType != null) updates.shapeType = shapeType as string;
  const rotation = formData.get("rotation");
  if (rotation != null) updates.rotation = Number(rotation);
  const seasonExtension = formData.get("seasonExtension");
  if (seasonExtension != null) updates.seasonExtension = seasonExtension as string;
  const irrigationType = formData.get("irrigationType");
  if (irrigationType != null) updates.irrigationType = irrigationType as string;
  const mulched = formData.get("mulched");
  if (mulched != null) updates.mulched = Number(mulched);

  await db.update(yardElements).set(updates).where(eq(yardElements.id, id));
}

export async function deleteYardElement(formData: FormData) {
  const id = Number(formData.get("id"));
  await db.delete(yardElements).where(eq(yardElements.id, id));
}

export async function duplicateYardElement(formData: FormData) {
  const id = Number(formData.get("id"));
  const yardId = Number(formData.get("yardId"));
  const original = await db.select().from(yardElements).where(eq(yardElements.id, id)).limit(1);
  if (!original[0]) return;
  const el = original[0];
  await db.insert(yardElements).values({
    yardId,
    shapeType: el.shapeType,
    x: el.x + 1,
    y: el.y + 1,
    width: el.width,
    height: el.height,
    label: el.label ? `${el.label} (copy)` : null,
    sunExposure: el.sunExposure,
    rotation: el.rotation,
  });
}
