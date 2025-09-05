// src/components/Gallery.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

type Item = {
  src: string;
  title?: string;
};

type Props = {
  items: Item[];
  /** показывать маленькие превью (по умолчанию true) */
  showThumbs?: boolean;
};

export default function Gallery({ items, showThumbs = true }: Props) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Чтобы портал знал, что мы уже на клиенте
  useEffect(() => setMounted(true), []);

  const openAt = useCallback((i: number) => {
    setIdx(i);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const next = useCallback(
    () => setIdx((i) => (i + 1) % items.length),
    [items.length]
  );
  const prev = useCallback(
    () => setIdx((i) => (i - 1 + items.length) % items.length),
    [items.length]
  );

  // Закрытие по Esc и навигация стрелками
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, next, prev]);

  // Блокируем скролл страницы, когда открыта модалка
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Безопасная отрисовка портала только на клиенте
  const portalTarget =
    typeof window !== 'undefined' ? document.body : null;

  // ====== Тумбы ======
  return (
    <>
      {showThumbs && (
        <div className="row g-3">
          {items.map((it, i) => (
            <div key={i} className="col-6 col-md-4">
              <button
                type="button"
                onClick={() => openAt(i)}
                className="d-block p-0 border-0 bg-transparent w-100"
                style={{ cursor: 'zoom-in' }}
              >
                <div className="ratio ratio-4x3 rounded overflow-hidden">
                  <img
                    src={it.src}
                    alt={it.title ?? `Фото ${i + 1}`}
                    className="w-100 h-100 object-fit-cover"
                    loading="lazy"
                  />
                </div>
                {it.title && (
                  <div className="small mt-1 text-truncate">{it.title}</div>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ====== МОДАЛКА ====== */}
      {mounted && portalTarget && open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={items[idx]?.title || 'Просмотр изображения'}
            // Весь оверлей
            onClick={close}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1055, // выше всего
              background: 'rgba(0,0,0,.72)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            {/* Контейнер изображения — клики внутри НЕ закрывают */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '96vw',
                maxHeight: '92vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={items[idx]?.src}
                alt={items[idx]?.title ?? `Фото ${idx + 1}`}
                style={{
                  maxWidth: '96vw',
                  maxHeight: '92vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0,0,0,.45)',
                  background: '#000',
                }}
              />

              {/* Заголовок/счётчик */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -8,
                  color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,.5)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 14,
                }}
              >
                <div className="text-truncate">
                  {items[idx]?.title || `Изображение ${idx + 1}`}
                </div>
                <div>{idx + 1} / {items.length}</div>
              </div>

              {/* Кнопки управления */}
              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Назад"
                    style={navBtnStyle('left')}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Вперёд"
                    style={navBtnStyle('right')}
                  >
                    ›
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={close}
                aria-label="Закрыть"
                style={{
                  position: 'absolute',
                  top: -12,
                  right: -12,
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,.35)',
                  background: 'rgba(0,0,0,.55)',
                  color: '#fff',
                  backdropFilter: 'blur(4px)',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          </div>,
          portalTarget
        )}
    </>
  );
}

function navBtnStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    [side]: -12,
    transform: 'translateY(-50%)',
    width: 44,
    height: 44,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,.35)',
    background: 'rgba(0,0,0,.55)',
    color: '#fff',
    fontSize: 24,
    lineHeight: '44px',
    textAlign: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    backdropFilter: 'blur(4px)',
  } as React.CSSProperties;
}
