import { Button, Typography, Box, CircularProgress, GlobalStyles } from '@mui/material';
import { useState } from 'react';
import { desktopDensityQuery, desktopFont, desktopSize, desktopSizeMin, desktopSpacing } from '../../theme/desktop-density';

const responsiveButtonSx = {
  minHeight: { xs: 36, sm: 36, md: 32, lg: 32, xl: 36 },
  fontSize: { xs: 14, sm: 14, md: 12, lg: 12, xl: 14 },
  px: { xs: 2, sm: 2, md: 2, lg: 1.5, xl: 2 },
  [desktopDensityQuery]: {
    minHeight: desktopSizeMin(36),
    minWidth: desktopSizeMin(64),
    fontSize: desktopSizeMin(14),
    px: desktopSizeMin(16),
    py: desktopSizeMin(6),
    borderRadius: desktopSizeMin(8),
  },
};

type DeleteAlertProps = {
  alertMsg: string;
  onDelete?: () => void;
  onClose?: () => void;
  confirmLabel?: string;
  loadingLabel?: string;
  confirmColor?: string;
};

function DeleteAlert(props: DeleteAlertProps) {
  const [isLoading, setIsLoading] = useState(false);
  const confirmLabel = props.confirmLabel || 'Delete';
  const loadingLabel = props.loadingLabel || 'Deleting...';
  const confirmColor = props.confirmColor || 'error';

  const handleOnClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await props.onDelete?.();
      props.onClose?.();
    } catch {
      // Parent handlers show the error toast; keep modal open for retry.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box data-delete-alert="true">
      <GlobalStyles
        styles={{
          '[role="dialog"]:has([data-delete-alert="true"]) button[aria-label="Close modal"]': {
            width: '28px !important',
            height: '28px !important',
            borderRadius: '9.6px !important',
            [desktopDensityQuery]: {
              width: `${desktopSize(28)} !important`,
              height: `${desktopSize(28)} !important`,
              borderRadius: `${desktopSize(9.6)} !important`,
            },
          },
          '[role="dialog"]:has([data-delete-alert="true"]) button[aria-label="Close modal"] svg': {
            width: '20px !important',
            height: '20px !important',
            [desktopDensityQuery]: {
              width: `${desktopSize(20)} !important`,
              height: `${desktopSize(20)} !important`,
            },
          },
        }}
      />
      <Typography
        variant="body1"
        sx={{
          mb: desktopSpacing(3),
          color: 'text.secondary',
          fontSize: desktopFont(16),
          overflowWrap: 'anywhere',
          lineHeight: { xs: 1.5, sm: 1.5, md: 1.5, lg: 1.5, xl: 1.5 },
        }}
      >
        {props.alertMsg}
      </Typography>

      <Box display="flex" gap={desktopSpacing(2)} flexWrap="wrap" justifyContent="flex-end">
        <Button variant="contained" color={confirmColor as any} onClick={handleOnClick} disabled={isLoading} sx={responsiveButtonSx}>
          {isLoading ? (
            <>
              <CircularProgress
                size={18}
                sx={{
                  width: { xs: 20, sm: 20, md: 20, lg: 10, xl: 20 },
                  height: { xs: 20, sm: 20, md: 20, lg: 10, xl: 20 },
                  mr: { xs: 1, sm: 1, md: 1, lg: 1, xl: 1 },
                  color: 'white',
                  [desktopDensityQuery]: {
                    width: desktopSize(20),
                    height: desktopSize(20),
                    mr: desktopSize(8),
                  },
                }}
              />
              {loadingLabel}
            </>
          ) : (
            confirmLabel
          )}
        </Button>

        <Button variant="outlined" onClick={props.onClose} disabled={isLoading} sx={responsiveButtonSx}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}

export default DeleteAlert;
