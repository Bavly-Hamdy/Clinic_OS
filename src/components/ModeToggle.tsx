import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/providers/ThemeProvider";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors group"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 group-hover:scale-110" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 group-hover:scale-110" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl glass-card p-2 border-white/10">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="rounded-xl px-3 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors my-0.5 font-medium"
        >
          <Sun className="h-4 w-4 me-3" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="rounded-xl px-3 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors my-0.5 font-medium"
        >
          <Moon className="h-4 w-4 me-3" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="rounded-xl px-3 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors my-0.5 font-medium"
        >
          <span className="h-4 w-4 me-3 flex items-center justify-center text-[10px] font-bold border border-current rounded-sm">S</span>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
