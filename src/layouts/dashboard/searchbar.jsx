import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, InputAdornment, OutlinedInput, Popover, Tooltip } from '@mui/material';

import { Iconify } from '../../components/iconify';
import { usePopover } from '../../hooks/use-popover';

export function Searchbar() {
  const navigate = useNavigate();
  const popover = usePopover();
  const [query, setQuery] = useState('');

  const handleSearch = (event) => {
    event.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/leads?search=${encodeURIComponent(q)}`);
      popover.onClose();
      setQuery('');
    }
  };

  return (
    <>
      <Tooltip title="Search">
        <IconButton onClick={popover.onOpen} aria-label="Search" sx={{ color: 'text.primary' }}>
          <Iconify icon="eva:search-fill" width={22} />
        </IconButton>
      </Tooltip>

      <Popover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 1.5, width: { xs: 280, sm: 400 }, p: 1 } } }}
      >
        <Box component="form" onSubmit={handleSearch}>
          <OutlinedInput
            autoFocus
            fullWidth
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads…"
            startAdornment={
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            }
            sx={{ height: 44 }}
          />
        </Box>
      </Popover>
    </>
  );
}
