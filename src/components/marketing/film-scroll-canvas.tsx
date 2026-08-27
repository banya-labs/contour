"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface FilmScrollCanvasProps {
  totalFrames?: number;
  framePrefix?: string;
  frameExt?: string;
  onFrameChange?: (frameIndex: number, progress: number) => void;
}

export function FilmScrollCanvas({
  totalFrames = 300,
  framePrefix = "/frames/frame_",
  frameExt = ".webp",
  onFrameChange,
}: FilmScrollCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedPercent, setLoadedPercent] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const targetFrameRef = useRef(1);
  const currentFrameRef = useRef(1);
  const animationFrameRef = useRef<number | null>(null);

  const getFrameUrl = useCallback((index: number) => {
    const pad = String(index).padStart(4, "0");
    return `${framePrefix}${pad}${frameExt}`;
  }, [framePrefix, frameExt]);

  // Preload all frames
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    const onImageLoaded = () => {
      loadedCount++;
      const pct = Math.floor((loadedCount / Math.max(totalFrames, 1)) * 100);
      setLoadedPercent(pct);
      if (loadedCount >= totalFrames) {
        setIsLoaded(true);
      }
    };

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);
      if (img.complete) {
        onImageLoaded();
      } else {
        img.onload = onImageLoaded;
        img.onerror = onImageLoaded;
      }
      images.push(img);
    }
    imagesRef.current = images;

    return () => {
      imagesRef.current = [];
    };
  }, [totalFrames, getFrameUrl]);

  // Draw frame on canvas
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesRef.current[frameIndex - 1];
    if (!img || !img.naturalWidth) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    const hRatio = canvasWidth / imgWidth;
    const vRatio = canvasHeight / imgHeight;
    const ratio = Math.max(hRatio, vRatio);

    const renderWidth = imgWidth * ratio;
    const renderHeight = imgHeight * ratio;
    const centerShiftX = (canvasWidth - renderWidth) / 2;
    const centerShiftY = (canvasHeight - renderHeight) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(
      img,
      0,
      0,
      imgWidth,
      imgHeight,
      centerShiftX,
      centerShiftY,
      renderWidth,
      renderHeight
    );
  }, []);

  // Resize canvas with DPR cap at 2
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      drawFrame(Math.round(currentFrameRef.current));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [drawFrame]);

  // Map scroll progress to frame index
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      const targetFrame = Math.max(1, Math.min(Math.round(progress * (totalFrames - 1)) + 1, totalFrames));
      targetFrameRef.current = targetFrame;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [totalFrames]);

  // RAF loop with smooth easing
  useEffect(() => {
    const loop = () => {
      const target = targetFrameRef.current;
      const current = currentFrameRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.01) {
        currentFrameRef.current += diff * 0.12;
        const rounded = Math.round(currentFrameRef.current);
        drawFrame(rounded);
        if (onFrameChange) {
          onFrameChange(rounded, (rounded - 1) / Math.max(totalFrames - 1, 1));
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawFrame, totalFrames, onFrameChange]);

  return (
    <>
      {!isLoaded && loadedPercent < 100 && (
        <div className="fixed inset-0 z-50 bg-[#0B1711] flex flex-col items-center justify-center text-white space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center animate-pulse">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-serif text-lg tracking-tight text-emerald-100 font-bold">
              Preparing Contour Film Scroll
            </p>
            <p className="text-xs font-mono text-emerald-400/80">
              Decoding frame sequences: {loadedPercent}%
            </p>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none bg-[#0B1711]"
        style={{ width: "100vw", height: "100vh" }}
      />
    </>
  );
}
