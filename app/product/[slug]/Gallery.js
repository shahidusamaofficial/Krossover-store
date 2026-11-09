'use client';

import { useState } from 'react';

/**
 * Client-side image gallery for the product detail page.
 * Shows the main image + a row of clickable thumbnails.
 * Kept minimal: no lightbox, no zoom — just swap the main image.
 */
export default function Gallery({ images, alt, garmentKind, Garment }) {
  const [active, setActive] = useState(0);
  const hasImages = images && images.length > 0;

  return (
    <>
      <div className="stage">
        {hasImages ? (
          <img src={images[active]} alt={`${alt} ${active + 1}`} />
        ) : (
          <Garment kind={garmentKind} />
        )}
      </div>

      {hasImages && images.length > 1 && (
        <div className="thumbs">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              className={`thumb${i === active ? ' active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
            >
              <img src={src} alt={`${alt} thumbnail ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
