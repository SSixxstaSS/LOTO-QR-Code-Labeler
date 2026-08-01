import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";





type DisplacementOptions = {
  height: number;
  width: number;
  radius: number;
  depth: number;
  strength?: number;
  chromaticAberration?: number;
};

const getDisplacementMap = ({
                              height,
                              width,
                              radius,
                              depth,
                            }: Omit<DisplacementOptions, "chromaticAberration" | "strength">) =>
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>.mix { mix-blend-mode: screen; }</style>
    <defs>
      <linearGradient id="Y" x1="0" x2="0" y1="${Math.ceil((radius / height) * 15)}%" y2="${Math.floor(100 - (radius / height) * 15)}%">
        <stop offset="0%" stop-color="#0F0" />
        <stop offset="100%" stop-color="#000" />
      </linearGradient>
      <linearGradient id="X" x1="${Math.ceil((radius / width) * 15)}%" x2="${Math.floor(100 - (radius / width) * 15)}%" y1="0" y2="0">
        <stop offset="0%" stop-color="#F00" />
        <stop offset="100%" stop-color="#000" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" height="${height}" width="${width}" fill="#808080" />
    <g filter="blur(2px)">
      <rect x="0" y="0" height="${height}" width="${width}" fill="#000080" />
      <rect x="0" y="0" height="${height}" width="${width}" fill="url(#Y)" class="mix" />
      <rect x="0" y="0" height="${height}" width="${width}" fill="url(#X)" class="mix" />
      <rect x="${depth}" y="${depth}" height="${height - 2 * depth}" width="${width - 2 * depth}" fill="#808080" rx="${radius}" ry="${radius}" filter="blur(${depth}px)" />
    </g>
  </svg>`);

const getDisplacementFilter = ({
                                 height,
                                 width,
                                 radius,
                                 depth,
                                 strength = 100,
                                 chromaticAberration = 0,
                               }: DisplacementOptions) =>
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="displace" color-interpolation-filters="sRGB">
        <feImage x="0" y="0" height="${height}" width="${width}" href="${getDisplacementMap({ height, width, radius, depth })}" result="displacementMap" />
        <feDisplacementMap transform-origin="center" in="SourceGraphic" in2="displacementMap" scale="${strength + chromaticAberration * 2}" xChannelSelector="R" yChannelSelector="G" />
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="displacedR" />
        <feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="${strength + chromaticAberration}" xChannelSelector="R" yChannelSelector="G" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="displacedG" />
        <feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="${strength}" xChannelSelector="R" yChannelSelector="G" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="displacedB" />
        <feBlend in="displacedR" in2="displacedG" mode="screen" />
        <feBlend in2="displacedB" mode="screen" />
      </filter>
    </defs>
  </svg>`) +
    "#displace";

// Detect whether this engine supports SVG filters as backdrop-filter (Chromium).
const supportsBackdropFilterUrl = (() => {
  if (typeof document === "undefined") return false;
  const el = document.createElement("div");
  el.style.cssText = "backdrop-filter: url(#test)";
  return (
      el.style.backdropFilter === "url(#test)" ||
      el.style.backdropFilter === 'url("#test")'
  );
})();

export interface LiquidGlassProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  radius?: number;
  depth?: number;
  strength?: number;
  blur?: number;
  chromaticAberration?: number;
  color?: "black" | "white";
  saturate?: number;
  brightness?: number;
}

export default function LiquidGlassDOM({
                                         children,
                                         className,
                                         style,
                                         radius = 24,
                                         depth = 10,
                                         strength = 100,
                                         blur = 0,
                                         chromaticAberration = 0,
                                         color,
                                         saturate = 1.5,
                                         brightness = 1.1,
                                       }: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const layer = filterRef.current;
    if (!container || !layer) return;

    const redraw = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width === 0 || height === 0) return;

      if (supportsBackdropFilterUrl) {
        const filter = getDisplacementFilter({
          height,
          width,
          radius,
          depth,
          strength,
          chromaticAberration,
        });
        layer.style.backdropFilter =
            `blur(${blur / 2}px) url('${filter}') blur(${blur}px) ` +
            `brightness(${brightness}) saturate(${saturate})`;
      } else {
        // Safari / Firefox fallback: plain frosted glass.
        const fallback = `blur(${Math.max(8, width / 12)}px) saturate(180%)`;
        layer.style.backdropFilter = fallback;
        (layer.style as CSSStyleDeclaration & Record<string, string>)[
            "-webkit-backdrop-filter"
            ] = fallback;
      }
    };

    redraw();
    const ro = new ResizeObserver(redraw);
    ro.observe(container);
    return () => ro.disconnect();
  }, [radius, depth, strength, blur, chromaticAberration, saturate, brightness]);

  const tint =
      color === "black"
          ? "rgba(9,9,11,0.5)"
          : color === "white"
              ? "rgba(250,250,250,0.5)"
              : "rgba(9,9,11,0)";

  return (
      <div
          ref={containerRef}
          className={className}
          style={{
            position: "relative",
            overflow: "hidden",
            display: "inline-block",
            borderRadius: radius,
            ...style,
          }}
      >

        <div
            ref={filterRef}
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              borderRadius: radius,
              background: tint,
              boxShadow: "inset 0 0 4px 0 rgba(250,250,250,0.5)",
              pointerEvents: "none",
            }}
        />

        <div style={{ position: "relative", zIndex: 2, width:"100%", height:"100%" }}>{children}</div>
      </div>
  );
}