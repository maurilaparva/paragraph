'use client';
import React, { useState, useEffect, useRef } from 'react';
import ChatList from './chat-list';

export default function ChatListContainer(props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const [sourcesVisible, setSourcesVisible] = useState<Record<string, boolean>>({});

  function markSourcesVisible(id: string) {
    setSourcesVisible((prev) => {
      if (prev[id]) return prev;
      return { ...prev, [id]: true };
    });
  }

  // 🔥 CAPTURE ALL LINK CLICKS MANUALLY
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a')) {
        props.onLinkClick?.();
      }
    };

    const node = containerRef.current;
    if (node) {
      node.addEventListener('click', handler, true);
    }

    return () => {
      if (node) {
        node.removeEventListener('click', handler, true);
      }
    };
  }, [props.onLinkClick]);

  return (
    <div ref={containerRef}>
      <ChatList
        {...props}
        previewUrl={previewUrl}
        previewPos={previewPos}
        setPreviewUrl={setPreviewUrl}
        setPreviewPos={setPreviewPos}
        sourcesVisible={sourcesVisible}
        markSourcesVisible={markSourcesVisible}
      />
    </div>
  );
}
