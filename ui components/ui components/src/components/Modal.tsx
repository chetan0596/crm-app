import { useRef, useEffect } from 'react';
import Portal from './Portal';
import { Box, Typography, IconButton } from '@mui/material';
import { MODAL_OVERLAY_Z_INDEX } from '../constants/z-index';
import { Iconify } from './iconify';
import { desktopDensityQuery, desktopSize, desktopSpacing } from '../theme/desktop-density';
import { modalCloseDensitySx, modalHeaderDensitySx, modalTitleDensitySx } from './common-models/responsive-styles';

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  maxWidth?: number;
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  maxWidth = 500,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  // ESC close
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Focus + scroll lock
  useEffect(() => {
    if (!isOpen) return;

    lastFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      lastFocusRef.current?.focus();
    };
  }, [isOpen]);

  // Focus modal
  useEffect(() => {
    if (isOpen && modelRef.current) {
      modelRef.current.focus();
    }
  }, [isOpen]);

  // Overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.currentTarget === e.target) onClose();
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <Box
        ref={overlayRef}
        onClick={handleOverlayClick}
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          bgcolor: 'rgba(46, 57, 68, 0.48)',
          zIndex: MODAL_OVERLAY_Z_INDEX,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-content"
      >
        <Box
          ref={modelRef}
          tabIndex={-1}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: desktopSpacing(2.25),
            boxShadow: '0 24px 60px rgba(24, 33, 43, 0.24)',
            width: '100%',
            maxWidth,
            flexShrink: 0,
            maxHeight: { xs: 'calc(100dvh - 64px)', lg: `calc(100dvh - ${desktopSize(64)})` },
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            outline: 'none',
          }}
        >
          <Box
            sx={{
              minHeight: {
                md: 44,
                xl: 50,
              },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              px: 2.15,
              py: 1,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'grey.200',
              flexShrink: 0,
              ...modalHeaderDensitySx,
            }}
          >
            <Typography
              id="modal-title"
              component="h2"
              noWrap
              sx={{
                minWidth: 0,
                fontSize: {
                  xs: 15,
                  sm: 16,
                  md: 14,
                  lg: 14,
                  xl: 17,
                },
                fontWeight: 600,
                color: 'text.primary',
                ...modalTitleDensitySx,
              }}
            >
              {title}
            </Typography>

            {showCloseButton && (
              <IconButton
                aria-label="Close modal"
                onClick={onClose}
                sx={{
                  flexShrink: 0,
                  width: {
                    xs: 28,
                    sm: 28,
                    md: 24,
                    lg: 24,
                    xl: 28,
                  },
                  height: {
                    xs: 28,
                    sm: 28,
                    md: 24,
                    lg: 24,
                    xl: 28,
                  },
                  borderRadius: { xs: 1.2, sm: 1.2, md: 1.2, lg: 1, xl: 1.2 },
                  color: 'common.white',
                  bgcolor: '#ff5733',
                  '&:hover': { bgcolor: '#e94725' },
                  ...modalCloseDensitySx,
                }}
              >
                <Iconify icon="mingcute:close-line" width={20} />
              </IconButton>
            )}
          </Box>

          <Box
            id="modal-content"
            sx={{
              px: { xs: 2, sm: 2.5 },
              py: 2,
              overflowY: 'auto',
              minHeight: 0,
              flex: 1,
              [desktopDensityQuery]: { px: desktopSize(20), py: desktopSize(16) },
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Portal>
  );
}
