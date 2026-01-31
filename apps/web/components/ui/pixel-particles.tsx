"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PixelParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

interface PixelParticlesProps {
  className?: string;
  count?: number;
  speed?: number;
  size?: number;
  colors?: string[];
}

export function PixelParticles({ 
  className, 
  count = 100, 
  speed = 1.5, 
  size = 3, 
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"] 
}: PixelParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<PixelParticle[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // 根据主题选择粒子颜色
  const getParticlesColors = () => {
    if (isDarkMode) {
      // 黑暗模式使用亮色粒子
      return ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
    } else {
      // 白天模式使用更鲜艳的深色粒子
      return ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed"];
    }
  };

  // 检测黑暗模式
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // 主题变化时更新粒子颜色
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 更新现有粒子的颜色
    particlesRef.current.forEach(particle => {
      particle.color = getParticlesColors()[Math.floor(Math.random() * getParticlesColors().length)];
    });
  }, [isDarkMode]);

  // 初始化粒子
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 设置画布尺寸
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // 创建粒子
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * size + 1,
      speedX: (Math.random() - 0.5) * speed * 0.5,
      speedY: (Math.random() - 0.5) * speed * 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      color: getParticlesColors()[Math.floor(Math.random() * getParticlesColors().length)]
    }));

    // 渲染粒子
    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 更新和渲染粒子
      particlesRef.current.forEach((particle, index) => {
        // 更新位置
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // 边界检测
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1;
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -1;
        }

        // 绘制像素粒子
        ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, "0")}`;
        ctx.fillRect(Math.floor(particle.x), Math.floor(particle.y), particle.size, particle.size);
      });

      animationIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [count, speed, size, colors]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "fixed inset-0 z-[-1] w-full h-full opacity-50 pointer-events-none",
        isDarkMode ? "opacity-40" : "opacity-50",
        className
      )}
    />
  );
}
