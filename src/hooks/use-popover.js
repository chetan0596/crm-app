import { useCallback, useState } from 'react';

// Minimal's `usePopover` equivalent.
export function usePopover() {
  const [anchorEl, setAnchorEl] = useState(null);

  const onOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const onClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return {
    open: Boolean(anchorEl),
    anchorEl,
    onOpen,
    onClose,
    setAnchorEl,
  };
}
