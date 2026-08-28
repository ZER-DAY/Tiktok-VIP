const PLACEHOLDER_SECRETS = new Set([
  "your-secret-key-change-in-production",
  "dev-secret-key",
  "build-placeholder",
]);

function requiredUrl(name: "DATABASE_URL" | "REDIS_URL", protocols: string[]): URL {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }

  if (!protocols.includes(url.protocol)) {
    throw new Error(`${name} must use ${protocols.join(" or ")}`);
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "db", "redis"]);
  if (process.env.ALLOW_LOCAL_SERVICES !== "true" && localHosts.has(url.hostname)) {
    throw new Error(
      `${name} points to ${url.hostname}; use the shared managed service, or set ALLOW_LOCAL_SERVICES=true only for local development`
    );
  }

  return url;
}

export function validateWorkerEnvironment() {
  requiredUrl("DATABASE_URL", ["postgresql:", "postgres:"]);
  requiredUrl("REDIS_URL", ["redis:", "rediss:"]);

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32 || PLACEHOLDER_SECRETS.has(secret)) {
    throw new Error(
      "BETTER_AUTH_SECRET must be a non-placeholder secret of at least 32 characters"
    );
  }
}
