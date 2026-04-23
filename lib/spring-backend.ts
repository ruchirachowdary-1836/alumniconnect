export function getSpringBackendBaseUrl() {
  const directUrl = process.env.SPRING_BOOT_BASE_URL?.trim();
  if (directUrl) {
    return directUrl.replace(/\/$/, "");
  }

  const vercelServiceUrl = process.env.SPRING_URL?.trim();
  if (vercelServiceUrl) {
    return vercelServiceUrl.replace(/\/$/, "");
  }

  return null;
}

export function hasSpringBackend() {
  return Boolean(getSpringBackendBaseUrl());
}

export async function springBackendJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false }> {
  const baseUrl = getSpringBackendBaseUrl();
  if (!baseUrl) {
    return { ok: false };
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}
