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
      `${name} points to ${url.hostname}; set ALLOW_LOCAL_SERVICES=true for self-hosted services or local development, or use the shared managed service`
    );
  }

  return url;
}

export function validateWorkerEnvironment() {
  requiredUrl("DATABASE_URL", ["postgresql:", "postgres:"]);
  requiredUrl("REDIS_URL", ["redis:", "rediss:"]);
}
