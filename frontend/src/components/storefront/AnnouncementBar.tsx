import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sparkles, ArrowRight } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const { theme } = useTheme();

  if (!theme || !theme.announcementEnabled || !theme.announcementText) {
    return null;
  }

  const content = (
    <div
      className="py-2.5 px-4 text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 text-center transition-all"
      style={{
        backgroundColor: theme.announcementBg || '#EF4444',
        color: theme.announcementColor || '#FFFFFF',
      }}
    >
      <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse" />
      <span>{theme.announcementText}</span>
      {theme.announcementLink && (
        <ArrowRight className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
      )}
    </div>
  );

  if (theme.announcementLink) {
    return (
      <Link to={theme.announcementLink} className="block hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};
