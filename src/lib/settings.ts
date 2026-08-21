import "server-only";
import { prisma } from "@/lib/db";

export async function getSettingValue<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export async function setSettingValue(key: string, value: unknown, category?: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value: JSON.stringify(value), category },
    create: { key, value: JSON.stringify(value), category },
  });
}
