export type Coordinate = {
  x: number;
  y: number;
};

export type ViewportSize = {
  width: number;
  height: number;
};

export const OCEAN_RADIUS = 1_000_000;
export const WORLD_UNIT_SIZE = 46;
export const VISIBLE_RANGE_RADIUS = 20;

export function roundCoordinate(value: number) {
  return Math.round(value);
}

export function getDistanceFromOrigin(point: Coordinate) {
  return Math.hypot(point.x, point.y);
}

export function isInsideOcean(point: Coordinate) {
  return getDistanceFromOrigin(point) <= OCEAN_RADIUS;
}

export function clampToOcean(point: Coordinate): Coordinate {
  const distance = getDistanceFromOrigin(point);

  if (distance <= OCEAN_RADIUS) {
    return point;
  }

  // 当拖拽越过圆形边界时，把点投影回圆周上，类似 Python 里按比例缩放向量。
  const scale = OCEAN_RADIUS / distance;

  return {
    x: point.x * scale,
    y: point.y * scale
  };
}

export function getCurrentCoordinate(center: Coordinate): Coordinate {
  return {
    x: roundCoordinate(center.x),
    y: roundCoordinate(center.y)
  };
}

export function screenToWorld(
  screen: Coordinate,
  center: Coordinate,
  viewport: ViewportSize,
  unitSize = WORLD_UNIT_SIZE
): Coordinate {
  return {
    x: center.x + (screen.x - viewport.width / 2) / unitSize,
    y: center.y - (screen.y - viewport.height / 2) / unitSize
  };
}

export function worldToScreen(
  world: Coordinate,
  center: Coordinate,
  viewport: ViewportSize,
  unitSize = WORLD_UNIT_SIZE
): Coordinate {
  return {
    x: viewport.width / 2 + (world.x - center.x) * unitSize,
    y: viewport.height / 2 - (world.y - center.y) * unitSize
  };
}

export function applyDragDelta(
  center: Coordinate,
  delta: Coordinate,
  unitSize = WORLD_UNIT_SIZE
): Coordinate {
  const nextCenter = {
    x: center.x - delta.x / unitSize,
    y: center.y + delta.y / unitSize
  };

  return clampToOcean(nextCenter);
}

export function formatCoordinate(point: Coordinate) {
  return `( x : ${point.x}, y : ${point.y} )`;
}
