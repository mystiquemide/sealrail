export type ApiKey = {
  id: number;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsed: string;
  revoked: boolean;
};

export const ALL_SCOPES = ["tasks:write", "tasks:read", "proofs:read", "agents:read", "workflows:read"];

export const INITIAL_KEYS: ApiKey[] = [
  { id: 1, name: "Backend runner", prefix: "sr_live_8f2c...", scopes: ["tasks:write", "proofs:read"], lastUsed: "Today", revoked: false },
];

const HEX_CHARS = "abcdef0123456789";

export function randomHex(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) out += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
  return out;
}

export function generateKeySecret(): { prefix: string; secret: string } {
  const tail = randomHex(32);
  return { prefix: `sr_live_${tail.slice(0, 8)}...`, secret: `sr_live_${tail}` };
}
