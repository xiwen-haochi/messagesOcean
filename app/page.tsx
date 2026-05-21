"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CoordinateIndicator from "@/components/CoordinateIndicator";
import InputPanel from "@/components/InputPanel";
import JumpPanel from "@/components/JumpPanel";
import MessageCard from "@/components/MessageCard";
import Toast, { type ToastMessage } from "@/components/Toast";
import {
  createMessage,
  getRandomCoordinate,
  getRangeMessages,
  type Message
} from "@/lib/api";
import {
  applyDragDelta,
  clampToOcean,
  getCurrentCoordinate,
  screenToWorld,
  WORLD_UNIT_SIZE,
  worldToScreen,
  type Coordinate,
  type ViewportSize
} from "@/lib/canvas";
import {
  createRangeCacheEntry,
  filterMessagesForVisible,
  findMessageAt,
  isCoordinateInsideCache,
  isCoordinateInsideRange,
  RANGE_FETCH_RADIUS,
  shouldFetchRange,
  type RangeCacheEntry
} from "@/lib/rangeCache";

type DragState = {
  isDragging: boolean;
  pointerId: number | null;
  lastX: number;
  lastY: number;
};

const INITIAL_CENTER: Coordinate = { x: 123456, y: -987654 };
const TOAST_LIFETIME_MS = 3800;

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const rangeCacheRef = useRef<RangeCacheEntry | null>(null);
  const rangeRequestSeqRef = useRef(0);
  const pendingRangeCenterRef = useRef<Coordinate | null>(null);
  const currentCoordinateRef = useRef<Coordinate>(INITIAL_CENTER);
  const toastIdRef = useRef(0);
  const suppressNextClickRef = useRef(false);
  const dragRef = useRef<DragState>({
    isDragging: false,
    pointerId: null,
    lastX: 0,
    lastY: 0
  });

  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 });
  const [offsetX, setOffsetX] = useState(INITIAL_CENTER.x);
  const [offsetY, setOffsetY] = useState(INITIAL_CENTER.y);
  const [messages, setMessages] = useState<Message[]>([]);
  const [focusedMessage, setFocusedMessage] = useState<Message | null>(null);
  const [author, setAuthor] = useState("");
  const [messageText, setMessageText] = useState("");
  const [jumpX, setJumpX] = useState(String(INITIAL_CENTER.x));
  const [jumpY, setJumpY] = useState(String(INITIAL_CENTER.y));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const center = useMemo<Coordinate>(
    () => ({ x: offsetX, y: offsetY }),
    [offsetX, offsetY]
  );

  const currentCoordinate = useMemo(
    () => getCurrentCoordinate(center),
    [center]
  );

  currentCoordinateRef.current = currentCoordinate;

  const focusedMessagePosition = useMemo(() => {
    if (!focusedMessage || viewport.width === 0 || viewport.height === 0) {
      return undefined;
    }

    const point = worldToScreen(focusedMessage, center, viewport);

    return {
      left: Math.min(Math.max(point.x - 140, 18), viewport.width - 306),
      top: Math.min(Math.max(point.y - 132, 78), viewport.height - 260)
    };
  }, [center, focusedMessage, viewport]);

  const pushToast = useCallback((type: ToastMessage["type"], text: string) => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;

    setToasts((current) => [...current, { id, type, text }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_LIFETIME_MS);
  }, []);

  const moveToCoordinate = useCallback((target: Coordinate) => {
    const clamped = clampToOcean(target);

    setOffsetX(clamped.x);
    setOffsetY(clamped.y);
    setJumpX(String(Math.round(clamped.x)));
    setJumpY(String(Math.round(clamped.y)));
  }, []);

  useEffect(() => {
    function resizeCanvas() {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Canvas 使用物理像素绘制，CSS 尺寸负责布局，避免 Retina 屏上发虚。
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);

      setViewport({
        width: rect.width,
        height: rect.height
      });
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    const coordinate = currentCoordinate;
    const cache = rangeCacheRef.current;

    // 仍在缓存覆盖范围内且未过期：只从本地过滤可见点，不请求 /range。
    if (!shouldFetchRange(coordinate, cache) && cache) {
      setMessages(filterMessagesForVisible(cache.messages, coordinate));
      setFocusedMessage(findMessageAt(cache.messages, coordinate));
      return;
    }

    const pendingCenter = pendingRangeCenterRef.current;

    // 已有进行中的大范围请求且当前坐标仍在其覆盖内：等待完成，避免每拖一格发新请求。
    if (
      pendingCenter &&
      isCoordinateInsideRange(coordinate, pendingCenter, RANGE_FETCH_RADIUS)
    ) {
      if (cache && isCoordinateInsideCache(coordinate, cache)) {
        setMessages(filterMessagesForVisible(cache.messages, coordinate));
        setFocusedMessage(findMessageAt(cache.messages, coordinate));
      }
      return;
    }

    const fetchCenter = coordinate;
    const requestSeq = ++rangeRequestSeqRef.current;
    pendingRangeCenterRef.current = fetchCenter;

    getRangeMessages(fetchCenter.x, fetchCenter.y, RANGE_FETCH_RADIUS)
      .then((response) => {
        if (requestSeq !== rangeRequestSeqRef.current) {
          return;
        }

        const entry = createRangeCacheEntry(fetchCenter, response.messages);
        rangeCacheRef.current = entry;

        const liveCoordinate = currentCoordinateRef.current;

        if (!isCoordinateInsideCache(liveCoordinate, entry)) {
          return;
        }

        setMessages(filterMessagesForVisible(entry.messages, liveCoordinate));
        setFocusedMessage(findMessageAt(entry.messages, liveCoordinate));
      })
      .catch(() => {
        if (requestSeq !== rangeRequestSeqRef.current) {
          return;
        }

        if (
          rangeCacheRef.current &&
          isCoordinateInsideCache(coordinate, rangeCacheRef.current)
        ) {
          return;
        }

        rangeCacheRef.current = null;
        setMessages([]);
        setFocusedMessage(null);
      })
      .finally(() => {
        if (pendingRangeCenterRef.current === fetchCenter) {
          pendingRangeCenterRef.current = null;
        }
      });
  }, [currentCoordinate.x, currentCoordinate.y]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context || viewport.width === 0 || viewport.height === 0) {
      return;
    }

    function draw() {
      if (!canvas || !context) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, viewport.width, viewport.height);

      const gradient = context.createRadialGradient(
        viewport.width / 2,
        viewport.height / 2,
        0,
        viewport.width / 2,
        viewport.height / 2,
        Math.max(viewport.width, viewport.height) * 0.75
      );
      gradient.addColorStop(0, "rgba(13, 30, 49, 0.78)");
      gradient.addColorStop(0.48, "rgba(4, 9, 17, 0.96)");
      gradient.addColorStop(1, "rgba(1, 3, 7, 1)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, viewport.width, viewport.height);

      drawGrid(context, center, viewport);
      drawAxis(context, center, viewport);
      drawMessages(context, messages, center, viewport);
      drawCenterMarker(context, currentCoordinate, viewport);

      animationRef.current = requestAnimationFrame(draw);
    }

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [center, currentCoordinate, messages, viewport]);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      isDragging: true,
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;

    if (!drag.isDragging || drag.pointerId !== event.pointerId) {
      return;
    }

    const delta = {
      x: event.clientX - drag.lastX,
      y: event.clientY - drag.lastY
    };

    if (Math.abs(delta.x) + Math.abs(delta.y) > 3) {
      suppressNextClickRef.current = true;
    }

    const nextCenter = applyDragDelta(center, delta);

    setOffsetX(nextCenter.x);
    setOffsetY(nextCenter.y);

    dragRef.current = {
      ...drag,
      lastX: event.clientX,
      lastY: event.clientY
    };
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (dragRef.current.pointerId === event.pointerId) {
      dragRef.current = {
        isDragging: false,
        pointerId: null,
        lastX: 0,
        lastY: 0
      };
    }
  }

  function handleCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    if (suppressNextClickRef.current) {
      // 浏览器会在拖拽释放后补发 click，这里拦掉，避免用户拖动画布时被误判为跳转。
      suppressNextClickRef.current = false;
      return;
    }

    if (!canvasRef.current) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const world = screenToWorld(
      {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      },
      center,
      viewport
    );

    moveToCoordinate({
      x: Math.round(world.x),
      y: Math.round(world.y)
    });
  }

  async function handleSubmitMessage() {
    if (!messageText.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createMessage({
        x: currentCoordinate.x,
        y: currentCoordinate.y,
        content: messageText.trim(),
        ...(author.trim() ? { author: author.trim() } : {})
      });

      if (response.success) {
        pushToast(
          "success",
          `Message posted successfully! (${currentCoordinate.x}, ${currentCoordinate.y})`
        );
        setMessageText("");

        const range = await getRangeMessages(
          currentCoordinate.x,
          currentCoordinate.y,
          RANGE_FETCH_RADIUS
        );
        const entry = createRangeCacheEntry(currentCoordinate, range.messages);
        rangeCacheRef.current = entry;
        setMessages(filterMessagesForVisible(entry.messages, currentCoordinate));
        setFocusedMessage(findMessageAt(entry.messages, currentCoordinate));
      } else {
        pushToast("error", "This coordinate already has a message.");
      }
    } catch {
      pushToast("error", "This coordinate already has a message.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleJump() {
    const parsedX = Number.parseInt(jumpX, 10);
    const parsedY = Number.parseInt(jumpY, 10);

    if (Number.isNaN(parsedX) || Number.isNaN(parsedY)) {
      pushToast("error", "Please enter valid integer coordinates.");
      return;
    }

    moveToCoordinate({ x: parsedX, y: parsedY });
  }

  async function handleRandomCoordinate() {
    setIsLoadingRandom(true);

    try {
      const coordinate = await getRandomCoordinate();
      moveToCoordinate(coordinate);
    } catch {
      pushToast("error", "Unable to load a random coordinate.");
    } finally {
      setIsLoadingRandom(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-ocean-bg text-slate-100">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCanvasClick}
      />

      <header className="pointer-events-none fixed left-6 top-5 z-20 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-ocean-cyan/30 bg-ocean-cyan/10 shadow-neon">
          ≋
        </span>
        <div>
          <h1 className="text-lg font-semibold tracking-wide">Message Ocean</h1>
          <p className="font-mono text-[11px] text-ocean-cyan/80">
            radius 1,000,000
          </p>
        </div>
      </header>

      <div className="pointer-events-none fixed left-1/2 top-1/2 z-10 -translate-x-1/2 translate-y-5 rounded-lg border border-ocean-cyan/20 bg-black/45 px-3 py-1.5 font-mono text-sm text-ocean-cyan shadow-neon backdrop-blur">
        ( x : {currentCoordinate.x}, y : {currentCoordinate.y} )
      </div>

      {focusedMessage && focusedMessagePosition ? (
        <MessageCard message={focusedMessage} style={focusedMessagePosition} />
      ) : null}

      <JumpPanel
        jumpX={jumpX}
        jumpY={jumpY}
        isLoadingRandom={isLoadingRandom}
        onJumpXChange={setJumpX}
        onJumpYChange={setJumpY}
        onJump={handleJump}
        onRandom={handleRandomCoordinate}
      />

      <CoordinateIndicator coordinate={currentCoordinate} />

      <InputPanel
        coordinate={currentCoordinate}
        author={author}
        message={messageText}
        isSubmitting={isSubmitting}
        onAuthorChange={setAuthor}
        onMessageChange={setMessageText}
        onSubmit={handleSubmitMessage}
      />

      <Toast
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((current) => current.filter((toast) => toast.id !== id))
        }
      />
    </main>
  );
}

function drawGrid(
  context: CanvasRenderingContext2D,
  center: Coordinate,
  viewport: ViewportSize
) {
  const minorStep = WORLD_UNIT_SIZE / 2;
  const majorStep = WORLD_UNIT_SIZE;
  const offsetPxX = ((-center.x * WORLD_UNIT_SIZE) % minorStep) + minorStep;
  const offsetPxY = ((center.y * WORLD_UNIT_SIZE) % minorStep) + minorStep;

  context.lineWidth = 1;

  for (let x = offsetPxX; x < viewport.width + minorStep; x += minorStep) {
    const isMajor = Math.round((x - offsetPxX) / minorStep) % 2 === 0;
    context.strokeStyle = isMajor
      ? "rgba(59, 199, 255, 0.13)"
      : "rgba(59, 199, 255, 0.055)";
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, viewport.height);
    context.stroke();
  }

  for (let y = offsetPxY; y < viewport.height + minorStep; y += minorStep) {
    const isMajor = Math.round((y - offsetPxY) / minorStep) % 2 === 0;
    context.strokeStyle = isMajor
      ? "rgba(59, 199, 255, 0.13)"
      : "rgba(59, 199, 255, 0.055)";
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(viewport.width, y);
    context.stroke();
  }

  // 粗网格用更大的间距叠加，形成参考图里深海地图的层次。
  context.strokeStyle = "rgba(59, 199, 255, 0.06)";
  for (let x = offsetPxX; x < viewport.width + majorStep * 5; x += majorStep * 5) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, viewport.height);
    context.stroke();
  }

  for (let y = offsetPxY; y < viewport.height + majorStep * 5; y += majorStep * 5) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(viewport.width, y);
    context.stroke();
  }
}

function drawAxis(
  context: CanvasRenderingContext2D,
  center: Coordinate,
  viewport: ViewportSize
) {
  const origin = worldToScreen({ x: 0, y: 0 }, center, viewport);

  context.save();
  context.strokeStyle = "rgba(150, 219, 255, 0.28)";
  context.lineWidth = 1.2;
  context.shadowColor = "rgba(59, 199, 255, 0.55)";
  context.shadowBlur = 10;

  if (origin.x >= 0 && origin.x <= viewport.width) {
    context.beginPath();
    context.moveTo(origin.x, 0);
    context.lineTo(origin.x, viewport.height);
    context.stroke();
  }

  if (origin.y >= 0 && origin.y <= viewport.height) {
    context.beginPath();
    context.moveTo(0, origin.y);
    context.lineTo(viewport.width, origin.y);
    context.stroke();
  }

  context.restore();
}

function drawMessages(
  context: CanvasRenderingContext2D,
  messages: Message[],
  center: Coordinate,
  viewport: ViewportSize
) {
  messages.forEach((message) => {
    const point = worldToScreen(message, center, viewport);

    if (
      point.x < -40 ||
      point.x > viewport.width + 40 ||
      point.y < -40 ||
      point.y > viewport.height + 40
    ) {
      return;
    }

    const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, 26);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    glow.addColorStop(0.18, "rgba(126, 92, 255, 0.92)");
    glow.addColorStop(0.48, "rgba(59, 199, 255, 0.35)");
    glow.addColorStop(1, "rgba(59, 199, 255, 0)");

    context.fillStyle = glow;
    context.beginPath();
    context.arc(point.x, point.y, 26, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#f8fbff";
    context.beginPath();
    context.arc(point.x, point.y, 4, 0, Math.PI * 2);
    context.fill();
  });
}

function drawCenterMarker(
  context: CanvasRenderingContext2D,
  coordinate: Coordinate,
  viewport: ViewportSize
) {
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;

  context.save();
  context.shadowColor = "#3BC7FF";
  context.shadowBlur = 18;
  context.strokeStyle = "rgba(59, 199, 255, 0.9)";
  context.fillStyle = "rgba(59, 199, 255, 0.28)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(centerX, centerY, 9, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();

  context.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillStyle = "rgba(170, 222, 255, 0.58)";
  context.textAlign = "right";
  context.fillText(String(coordinate.y), centerX - 8, 68);
  context.textAlign = "left";
  context.fillText(String(coordinate.x), 22, centerY + 20);
}
