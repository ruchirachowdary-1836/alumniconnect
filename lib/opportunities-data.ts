import { fallbackOpportunities } from "@/lib/demo-content";
import { readPortalOpportunities, type StoredOpportunity } from "@/lib/portal-store";

export type OpportunityBoardItem = StoredOpportunity;

export async function getOpportunities(): Promise<OpportunityBoardItem[]> {
  const liveOpportunities = await readPortalOpportunities();
  return liveOpportunities.length > 0 ? liveOpportunities : fallbackOpportunities;
}
