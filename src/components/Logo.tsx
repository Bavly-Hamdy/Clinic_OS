import { useTheme } from "@/providers/ThemeProvider";
import { useEffect, useState } from "react";

export function Logo({ className = "h-8 w-auto object-contain" }: { className?: string }) {
  const { theme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setResolvedTheme(isDark ? "dark" : "light");
    } else {
      setResolvedTheme(theme as "light" | "dark");
    }
  }, [theme]);

  const logoSrc = resolvedTheme === "dark" ? "/LogoDark.png" : "/LogoLight.png";

  return (
    <img 
      src={logoSrc} 
      alt="Clinic Hub" 
      className={className}
      onError={(e) => {
        // Fallback if image fails to load
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}
