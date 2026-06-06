export type LegalContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; intro?: string; items: string[] }
  | { type: 'emails'; prefix?: string; addresses: string[] };

export type LegalSection = {
  id: string;
  number?: number;
  title: string;
  blocks: LegalContentBlock[];
};

export function buildLegalNav(sections: LegalSection[]) {
  return sections.map(({ id, number, title }) => ({
    id,
    label: number ? `${number}. ${title}` : title,
  }));
}
