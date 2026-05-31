import { useEffect, useRef, useState } from "react";

interface Size {
  width: number;
  height: number;
}

/**
 * Tracks the rendered size of an element via ResizeObserver so the radial
 * layout can recompute when the viewport changes. Returns a ref to attach and
 * the latest measured size.
 */
export function useElementSize<T extends HTMLElement>(): [
  React.RefObject<T>,
  Size,
] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () =>
      setSize({ width: node.clientWidth, height: node.clientHeight });

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
