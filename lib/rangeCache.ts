import type { Message } from "@/lib/api";
import type { Coordinate } from "@/lib/canvas";
import { VISIBLE_RANGE_RADIUS } from "@/lib/canvas";

/** 单次拉取半径 = 可见半径 × 30，拖动时尽量在本地缓存内命中。 */
export const RANGE_CACHE_MULTIPLIER = 30;
export const RANGE_FETCH_RADIUS = VISIBLE_RANGE_RADIUS * RANGE_CACHE_MULTIPLIER;
/** 本地缓存有效期：5 分钟。 */
export const RANGE_CACHE_TTL_MS = 5 * 60 * 1000;

export type RangeCacheEntry = {
  /** 发起 /range 请求时的中心坐标。 */
  center: Coordinate;
  /** 与请求参数 radius 一致，用于判断当前坐标是否仍在缓存覆盖内。 */
  radius: number;
  messages: Message[];
  fetchedAt: number;
};

export function createRangeCacheEntry(
  center: Coordinate,
  messages: Message[]
): RangeCacheEntry {
  return {
    center,
    radius: RANGE_FETCH_RADIUS,
    messages,
    fetchedAt: Date.now()
  };
}

export function isCacheExpired(entry: RangeCacheEntry, now = Date.now()): boolean {
  return now - entry.fetchedAt > RANGE_CACHE_TTL_MS;
}

/** 切比雪夫距离，适合整数网格上的 range 半径判断。 */
export function chebyshevDistance(a: Coordinate, b: Coordinate): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function isCoordinateInsideCache(
  coordinate: Coordinate,
  entry: RangeCacheEntry
): boolean {
  return chebyshevDistance(coordinate, entry.center) <= entry.radius;
}

/** 用缓存中心 + 半径构造“覆盖区域”，供进行中的请求复用判断。 */
export function isCoordinateInsideRange(
  coordinate: Coordinate,
  center: Coordinate,
  radius: number
): boolean {
  return chebyshevDistance(coordinate, center) <= radius;
}

export function shouldFetchRange(
  coordinate: Coordinate,
  entry: RangeCacheEntry | null
): boolean {
  if (!entry) {
    return true;
  }

  if (isCacheExpired(entry)) {
    return true;
  }

  return !isCoordinateInsideCache(coordinate, entry);
}

export function findMessageAt(
  messages: Message[],
  coordinate: Coordinate
): Message | null {
  return (
    messages.find(
      (message) => message.x === coordinate.x && message.y === coordinate.y
    ) ?? null
  );
}

/** 画布上只展示当前可见半径内的消息点（与原先 radius=20 的展示范围一致）。 */
export function filterMessagesForVisible(
  messages: Message[],
  center: Coordinate,
  visibleRadius = VISIBLE_RANGE_RADIUS
): Message[] {
  return messages.filter(
    (message) => chebyshevDistance(message, center) <= visibleRadius
  );
}
