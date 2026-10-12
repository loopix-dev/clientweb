import { parseAddress } from "./minecraft";

/** Fields accepted when creating or editing a server (admin panel). */
export interface ServerFields {
  name: string;
  address: string;
  description: string;
  version: string;
}

/** Trims every field; unknown/missing values become empty strings. */
export function cleanServerFields(input: Partial<ServerFields> | Record<string, unknown>): ServerFields {
  const str = (value: unknown): string => (typeof value === "string" ? value : "");
  return {
    name: str(input.name).trim(),
    address: str(input.address).trim(),
    description: str(input.description).trim(),
    version: str(input.version).trim(),
  };
}

/** Field-level validation shared by create and update. Returns an error or null. */
export function serverFieldErrors(fields: ServerFields): string | null {
  if (!fields.name) return "Server name is required.";
  if (fields.name.length > 60) return "Server name must be 60 characters or fewer.";
  if (!fields.address) return "Server address is required.";
  if (!parseAddress(fields.address)) {
    return "Address must look like `play.example.com`, `play.example.com:25565` or `[::1]:25565`.";
  }
  if (fields.description.length > 200) return "Description must be 200 characters or fewer.";
  if (fields.version.length > 40) return "Version label must be 40 characters or fewer.";
  return null;
}
