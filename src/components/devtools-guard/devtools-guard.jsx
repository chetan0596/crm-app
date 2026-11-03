import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { Logo } from "../logo";

const DOCK_THRESHOLD = 160;

function isDevtoolsDocked() {
  return (
    window.outerWidth - window.innerWidth > DOCK_THRESHOLD ||
    window.outerHeight - window.innerHeight > DOCK_THRESHOLD
  );
}

function isDevtoolsUndocked() {
  const start = performance.now();
  // eslint-disable-next-line no-debugger
  debugger;
  return performance.now() - start > 100;
}

const SHORTCUT_BLOCK = (e) => {
  const key = e.key.toUpperCase();
  if (
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(key)) ||
    (e.metaKey && e.altKey && ["I", "J", "C"].includes(key)) ||
    (e.ctrlKey && key === "U") ||
    (e.metaKey && e.altKey && key === "U")
  ) {
    e.preventDefault();
    e.stopPropagation();
  }
};

const CONTEXTMENU_BLOCK = (e) => e.preventDefault();

export default function DevtoolsGuard({ children }) {
  const [blocked, setBlocked] = useState(false);
  const enabled = import.meta.env.PROD;
  // const enabled = true;

  useEffect(() => {
    if (!enabled) return undefined;
    const check = () => setBlocked(isDevtoolsDocked() || isDevtoolsUndocked());
    const timer = setInterval(check, 1000);
    check();

    window.addEventListener("keydown", SHORTCUT_BLOCK, true);
    window.addEventListener("contextmenu", CONTEXTMENU_BLOCK, true);

    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", SHORTCUT_BLOCK, true);
      window.removeEventListener("contextmenu", CONTEXTMENU_BLOCK, true);
    };
  }, [enabled]);

  if (enabled && blocked) {
    return (
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: (theme) => theme.zIndex.modal + 1,
          bgcolor: "background.default",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          textAlign: "center",
          px: 3,
        }}
      >
        <Logo width={120} href={null} />
        <Typography variant="h5">Developer tools detected</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          Please close the browser developer tools and reload the page to continue.
        </Typography>
      </Box>
    );
  }

  return children;
}

DevtoolsGuard.propTypes = {
  children: PropTypes.node,
};
