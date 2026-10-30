import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type PortalProps = {
  children: React.ReactNode;
  container?: HTMLElement;
};

export function Portal({ children, container }: PortalProps) {
  const portalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!container) {
      portalRef.current = document.body;
    } else {
      portalRef.current = container;
    }
  }, [container]);

  if (!portalRef.current) {
    return null;
  }

  return createPortal(children, portalRef.current);
}
