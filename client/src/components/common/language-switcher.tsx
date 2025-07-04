import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "px-3 py-1 text-sm font-medium rounded-md transition-colors",
          language === 'en' 
            ? "bg-white text-gray-900 shadow-sm" 
            : "text-gray-500 hover:text-gray-700"
        )}
        onClick={() => setLanguage('en')}
      >
        English
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "px-3 py-1 text-sm font-medium rounded-md transition-colors",
          language === 'ar' 
            ? "bg-white text-gray-900 shadow-sm" 
            : "text-gray-500 hover:text-gray-700"
        )}
        onClick={() => setLanguage('ar')}
      >
        العربية
      </Button>
    </div>
  );
}
