import { prisma } from "./prisma";

const POINTS_PER_BAHT = 1;

const TIERS = [
  { name: "silver", minPoints: 500, discount: 5 },
  { name: "gold", minPoints: 2000, discount: 10 },
  { name: "platinum", minPoints: 5000, discount: 15 },
] as const;

export function calculateTier(points: number): string {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) return TIERS[i].name;
  }
  return "none";
}

export function getDiscount(tier: string): number {
  const t = TIERS.find((t) => t.name === tier);
  return t?.discount || 0;
}

export async function addPoints(userId: string, amount: number): Promise<{ points: number; tier: string }> {
  const pointsToAdd = Math.floor(amount * POINTS_PER_BAHT);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { memberPoints: { increment: pointsToAdd } },
  });

  const newTier = calculateTier(user.memberPoints);
  if (newTier !== user.memberTier) {
    await prisma.user.update({
      where: { id: userId },
      data: { memberTier: newTier },
    });
  }

  return { points: user.memberPoints, tier: newTier };
}

export { TIERS };
