/** Resolve DB name from a Mongo connection string (defaults to gosource). */
export function getDatabaseNameFromMongoUri(mongoUri: string) {
  const match = mongoUri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/i);
  const name = match?.[1]?.trim();

  if (name) {
    return name;
  }

  return 'gosource';
}
