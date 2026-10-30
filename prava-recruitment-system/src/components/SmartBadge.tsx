import React, { useState } from 'react';
import { Award, Shield, Building2, Image as ImageIcon } from 'lucide-react';

interface SmartBadgeProps {
  badge?: string | null;
  alt?: string;
  defaultIcon?: 'rank' | 'sector' | 'shield' | 'image';
  className?: string;
  imgClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Checks whether a badge string represents an image source (URL, path, or data URI)
 * or a URL-like string. Strictly distinguishes images/links from true unicode emojis.
 */
export function isImageSource(str?: string | null): boolean {
  if (!str) return false;
  const trimmed = str.trim().replace(/\/+$/, '');
  if (!trimmed) return false;

  // Obvious protocols, paths, and schemes
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('www.') ||
    trimmed.startsWith('cdn.') ||
    trimmed.startsWith('src/') ||
    trimmed.startsWith('public/')
  ) {
    return true;
  }

  // Any string containing path separators or url schemes
  if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('://')) {
    return true;
  }

  // Image file extensions (even if followed by query params, e.g. .png?size=1024)
  const cleanBeforeQuery = trimmed.split('?')[0].split('#')[0].toLowerCase();
  if (
    cleanBeforeQuery.endsWith('.png') ||
    cleanBeforeQuery.endsWith('.jpg') ||
    cleanBeforeQuery.endsWith('.jpeg') ||
    cleanBeforeQuery.endsWith('.webp') ||
    cleanBeforeQuery.endsWith('.svg') ||
    cleanBeforeQuery.endsWith('.gif') ||
    cleanBeforeQuery.endsWith('.ico') ||
    cleanBeforeQuery.endsWith('.bmp') ||
    cleanBeforeQuery.endsWith('.avif')
  ) {
    return true;
  }

  // Any string longer than 6 characters or containing alphanumeric/symbols that don't belong to emojis
  if (trimmed.length > 6 && /[a-zA-Z0-9_\-\.]/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Normalizes an image source (e.g. prepending https:// if needed, resolving /public or /src/assets paths)
 */
export function normalizeImageSource(src?: string | null): string {
  if (!src) return '';
  let trimmed = src.trim().replace(/\/+$/, '');
  if (!trimmed) return '';

  if (trimmed.startsWith('www.') || trimmed.startsWith('cdn.')) {
    return `https://${trimmed}`;
  }

  // Handle local Vite / public assets:
  // If stored as "src/assets/images/swat_round_badge_..." or "/src/assets/images/..."
  // or "public/assets/..." or "/public/..."
  // In Vite SPA, files in public/ are served at root, so "/assets/images/..." or "/..."
  if (trimmed.startsWith('src/assets/images/')) {
    trimmed = '/assets/images/' + trimmed.slice('src/assets/images/'.length);
  } else if (trimmed.startsWith('/src/assets/images/')) {
    trimmed = '/assets/images/' + trimmed.slice('/src/assets/images/'.length);
  } else if (trimmed.startsWith('public/assets/images/')) {
    trimmed = '/assets/images/' + trimmed.slice('public/assets/images/'.length);
  } else if (trimmed.startsWith('/public/assets/images/')) {
    trimmed = '/assets/images/' + trimmed.slice('/public/assets/images/'.length);
  } else if (trimmed.startsWith('public/')) {
    trimmed = '/' + trimmed.slice('public/'.length);
  } else if (trimmed.startsWith('/public/')) {
    trimmed = '/' + trimmed.slice('/public/'.length);
  } else if (trimmed.startsWith('src/')) {
    trimmed = '/' + trimmed;
  }

  return trimmed;
}

/**
 * Extracts a safe emoji string for use in native HTML elements like <option> or <title>,
 * where <img> tags cannot be rendered. If the badge is an image URL or invalid, returns fallback.
 */
export function getSafeBadgeEmoji(badge?: string | null, fallbackEmoji: string = '🎖️'): string {
  if (!badge) return fallbackEmoji;
  const trimmed = badge.trim();
  if (!trimmed) return fallbackEmoji;
  
  // If it's an image, URL, contains slashes, dots, or is longer than 6 characters, it's not a safe emoji
  if (isImageSource(trimmed) || trimmed.length > 6 || /[\/\.\:\\]/.test(trimmed)) {
    return fallbackEmoji;
  }
  return trimmed;
}

/**
 * SmartBadge: Renders image URLs as proper <img> tags with error fallback,
 * and text/emojis as high-res glyphs.
 * CRITICAL: Under no circumstances does this component ever render a raw URL or file path as plain text!
 */
export const SmartBadge: React.FC<SmartBadgeProps> = ({
  badge,
  alt = 'Badge',
  defaultIcon = 'shield',
  className = '',
  imgClassName = 'w-full h-full object-cover',
}) => {
  const [hasError, setHasError] = useState(false);
  const isImg = isImageSource(badge);
  const normalizedSrc = normalizeImageSource(badge);

  const renderFallbackIcon = () => {
    switch (defaultIcon) {
      case 'rank':
        return <Award className="w-1/2 h-1/2 text-amber-400" />;
      case 'sector':
        return <Building2 className="w-1/2 h-1/2 text-blue-400" />;
      case 'image':
        return <ImageIcon className="w-1/2 h-1/2 text-slate-400" />;
      case 'shield':
      default:
        return <Shield className="w-1/2 h-1/2 text-amber-400" />;
    }
  };

  // If it is an image source and has not errored out, render <img>
  if (isImg && normalizedSrc && !hasError) {
    return (
      <div className={`overflow-hidden flex items-center justify-center shrink-0 ${className}`}>
        <img
          src={normalizedSrc}
          alt={alt}
          className={imgClassName}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // If it was an image URL that failed to load, ALWAYS show the fallback icon, NEVER plain text!
  if (isImg || hasError || !badge) {
    return (
      <div className={`flex items-center justify-center shrink-0 select-none ${className}`}>
        {renderFallbackIcon()}
      </div>
    );
  }

  // Verify that badge is truly a valid short emoji/text (<= 6 chars, no url chars)
  const trimmed = badge.trim();
  const isValidEmojiText = trimmed.length <= 6 && !/[\/\.\:\\a-zA-Z0-9_\-]/.test(trimmed);

  return (
    <div className={`flex items-center justify-center shrink-0 select-none ${className}`}>
      {isValidEmojiText ? (
        <span className="leading-none">{trimmed}</span>
      ) : (
        renderFallbackIcon()
      )}
    </div>
  );
};
