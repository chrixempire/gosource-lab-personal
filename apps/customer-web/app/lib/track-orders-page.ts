export type TrackOrdersTab = 'orders' | 'insight';
export type InsightViewMode = 'cards' | 'table';

export const DEFAULT_INSIGHT_VIEW: InsightViewMode = 'table';

export const TRACK_ORDERS_TAB_OPTIONS = [
  { label: 'Orders', value: 'orders' },
  { label: 'Insight', value: 'insight' },
] as const;

export function parseTrackOrdersTabFromQuery(
  query: Record<string, string | Array<string | null> | undefined | null>,
): TrackOrdersTab {
  const raw = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  return raw === 'insight' ? 'insight' : 'orders';
}

export function trackOrdersTabToRouteQuery(tab: TrackOrdersTab): Record<string, string> {
  return tab === 'insight' ? { tab: 'insight' } : { tab: 'orders' };
}

function readQueryString(
  query: Record<string, string | Array<string | null> | undefined | null>,
  key: string,
) {
  const entry = query[key];
  return Array.isArray(entry) ? entry[0] : entry;
}

export function parseInsightViewFromQuery(
  query: Record<string, string | Array<string | null> | undefined | null>,
  defaultView: InsightViewMode = DEFAULT_INSIGHT_VIEW,
): InsightViewMode {
  const raw = readQueryString(query, 'insightView');
  if (raw === 'cards' || raw === 'table') {
    return raw;
  }
  return defaultView;
}

export function insightViewToRouteQuery(view: InsightViewMode): Record<string, string> {
  return { insightView: view };
}
