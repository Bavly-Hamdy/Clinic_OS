import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLang = i18n.language?.split('-')[0] || 'en';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors group"
        >
          <Languages className="h-[1.2rem] w-[1.2rem] transition-all group-hover:scale-110" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl glass-card p-2 border-white/10 min-w-[120px]">
        <DropdownMenuItem 
          onClick={() => changeLanguage("en")}
          className="rounded-xl px-3 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors my-0.5 font-bold flex items-center justify-between"
        >
          <div className="flex items-center">
            <span className="me-3 filter grayscale-[0.5] group-hover:grayscale-0">🇺🇸</span>
            <span className="text-sm">English</span>
          </div>
          {currentLang === 'en' && <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage("ar")}
          className="rounded-xl px-3 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors my-0.5 font-bold flex items-center justify-between"
        >
          <div className="flex items-center">
            <span className="me-3 filter grayscale-[0.5] group-hover:grayscale-0">🇪🇬</span>
            <span className="text-sm font-arabic">العربية</span>
          </div>
          {currentLang === 'ar' && <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
