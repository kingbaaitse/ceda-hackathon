/**
 * Shims for the two Next.js APIs the Obsidian UI originals import.
 * They keep the original source compiling untouched in this Vite app.
 */
import React from 'react';

type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string | { src: string };
  alt?: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  quality?: number;
};

export default function Image({
  src,
  alt = '',
  width,
  height,
  fill,
  priority,
  sizes,
  quality,
  style,
  ...rest
}: ImgProps) {
  const resolved = typeof src === 'string' ? src : src?.src;
  return (
    <img
      src={resolved}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      sizes={sizes}
      style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style } : style}
      {...rest}
    />
  );
}
