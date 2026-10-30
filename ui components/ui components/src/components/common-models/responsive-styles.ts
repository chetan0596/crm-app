import { desktopDensityQuery, desktopSize, desktopSizeMin, desktopSpacing } from '../../theme/desktop-density';

/**
 * Responsive styles for common components
 */

export const modalCloseDensitySx = {
  [desktopDensityQuery]: {
    width: desktopSize(28),
    height: desktopSize(28),
    borderRadius: desktopSize(9.6),
  },
};

export const modalHeaderDensitySx = {
  [desktopDensityQuery]: {
    minHeight: desktopSize(50),
  },
};

export const modalTitleDensitySx = {
  [desktopDensityQuery]: {
    fontSize: desktopSize(17),
  },
};

export const formDensitySx = {
  [desktopDensityQuery]: {
    '& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': {
      height: desktopSize(40),
    },
    '& .MuiOutlinedInput-root.MuiInputBase-multiline': {
      minHeight: desktopSize(40),
    },
    '& .MuiInputBase-input': {
      fontSize: desktopSize(14),
      px: desktopSize(1.25),
    },
    '& .MuiInputBase-inputMultiline': {
      fontSize: desktopSize(14),
      px: desktopSize(1.25),
      py: desktopSize(0.75),
    },
  },
};
