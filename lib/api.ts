export type Message = {
  x: number;
  y: number;
  content: string;
  author: string | null;
  timestamp: string;
};

export type MessageCreate = {
  x: number;
  y: number;
  content: string;
  author?: string;
};

export type MessageGetResponse = {
  exists: boolean;
  message?: Message;
};

export type RangeMessagesResponse = {
  messages: Message[];
};

export type ExistsResponse = {
  exists: boolean;
};

export type SuccessResponse = {
  success: boolean;
};

export type RandomCoordinateResponse = {
  x: number;
  y: number;
};

const API_BASE_URL = "http://43.153.221.17:11888";

function buildUrl(path: string, params?: Record<string, number | string>) {
  const url = new URL(path, API_BASE_URL);

  // 类似 Python 的 dict 遍历：只把明确传入的查询参数拼到 URL 上。
  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function requestQueryJson<T>(
  path: string,
  params: Record<string, number | string>
): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getMessage(x: number, y: number) {
  return requestQueryJson<MessageGetResponse>("/message", { x, y });
}

export function createMessage(payload: MessageCreate) {
  return requestJson<SuccessResponse>("/message", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getExists(x: number, y: number) {
  return requestQueryJson<ExistsResponse>("/exists", { x, y });
}

export function getRandomCoordinate() {
  return requestQueryJson<RandomCoordinateResponse>("/random", {});
}

export function getRangeMessages(x: number, y: number, radius: number) {
  return requestQueryJson<RangeMessagesResponse>("/range", { x, y, radius });
}
