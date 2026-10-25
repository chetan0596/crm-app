import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";

const gridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
  gap: 2,
};

const fullSpanSx = { gridColumn: '1 / -1' };

const dialogPaperSx = {
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.12)',
};

const strVal = (v) => (v === "" || v == null ? "" : String(v));

export default function LeadFormDialog({
  open,
  edit,
  form,
  setForm,
  categories = [],
  leadSources = [],
  leadStages = [],
  users = [],
  states = [],
  cities = [],
  tags = [],
  saving = false,
  err = "",
  showAdvance = false,
  setShowAdvance,
  onClose,
  onSave,
  showAddCity = false,
  newCityName = "",
  setNewCityName,
  addingCity = false,
  onOpenAddCity,
  onCloseAddCity,
  onSaveCity,
}) {
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    onClose();
  };

  const handleAddCityClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    onCloseAddCity();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className={`fas ${edit ? 'fa-edit' : 'fa-plus'}`} style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {edit ? "Edit Lead" : "Add Lead"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={gridSx}>
            <Box sx={fullSpanSx}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: .5 }}>
                Type <Box component="span" sx={{ color: 'error.main' }}>*</Box>
              </Typography>
              <RadioGroup row value={form.lead_type} onChange={update('lead_type')}>
                <FormControlLabel value="business" control={<Radio size="small" />} label="Business" />
                <FormControlLabel value="individual" control={<Radio size="small" />} label="Individual" />
              </RadioGroup>
            </Box>

            <TextField
              size="small"
              label="Name"
              required
              placeholder="Enter full name"
              value={form.name}
              onChange={update('name')}
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 1.5 }}>
              <FormControl size="small" fullWidth required>
                <InputLabel>Code</InputLabel>
                <Select label="Code" value={strVal(form.phone_code)} onChange={update('phone_code')}>
                  <MenuItem value="+91 IN">+91 IN</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Phone"
                required
                placeholder="Phone number"
                value={form.phone}
                onChange={update('phone')}
                fullWidth
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 1.5 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Code</InputLabel>
                <Select label="Code" value={strVal(form.whatsapp_code)} onChange={update('whatsapp_code')}>
                  <MenuItem value="+91 IN">+91 IN</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Whatsapp"
                placeholder="Whatsapp number"
                value={form.whatsapp}
                onChange={update('whatsapp')}
                fullWidth
              />
            </Box>

            <FormControl size="small" fullWidth required>
              <InputLabel>Lead Stage</InputLabel>
              <Select label="Lead Stage" value={form.stage} onChange={update('stage')}>
                {(leadStages.length ? leadStages : [{ id: 0, name: 'New Lead' }]).map((s) => (
                  <MenuItem key={s.id ?? s.name} value={s.name}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Lead Category</InputLabel>
              <Select
                label="Lead Category"
                value={strVal(form.lead_category_id)}
                onChange={(e) => setForm({ ...form, lead_category_id: e.target.value, lead_subcategory_id: "" })}
              >
                <MenuItem value=""><em>Choose</em></MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Lead Source</InputLabel>
              <Select label="Lead Source" value={form.source} onChange={update('source')}>
                <MenuItem value=""><em>Choose</em></MenuItem>
                {leadSources.map((s) => (
                  <MenuItem key={s.id ?? s.name} value={s.name}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {form.source === "Other" && (
              <TextField
                size="small"
                label="Source (Other)"
                placeholder="Specify source"
                value={form.source_other}
                onChange={update('source_other')}
                fullWidth
                sx={fullSpanSx}
              />
            )}

            <TextField
              size="small"
              label="Description"
              placeholder="Description"
              value={form.description}
              onChange={update('description')}
              multiline
              rows={3}
              fullWidth
              sx={fullSpanSx}
            />

            <Box sx={{ ...fullSpanSx, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                Advance Options
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => setShowAdvance(!showAdvance)}
              >
                {showAdvance ? "Click to hide" : "Click to show"}
              </Button>
            </Box>

            <Collapse in={showAdvance} unmountOnExit sx={fullSpanSx}>
              <Box sx={gridSx}>
                <TextField
                  size="small"
                  type="email"
                  label="Email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={update('email')}
                  fullWidth
                />
                <TextField
                  size="small"
                  type="url"
                  label="Website"
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={update('website')}
                  fullWidth
                />

                <TextField
                  size="small"
                  label="Company"
                  placeholder="Company name"
                  value={form.company_name}
                  onChange={update('company_name')}
                  fullWidth
                />

                <TextField
                  size="small"
                  label="Address"
                  placeholder="Address"
                  value={form.address}
                  onChange={update('address')}
                  multiline
                  rows={3}
                  fullWidth
                  sx={fullSpanSx}
                />

                <Box sx={{ ...fullSpanSx, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <TextField
                    size="small"
                    label="Pincode"
                    placeholder="Pincode"
                    value={form.pincode}
                    onChange={update('pincode')}
                    fullWidth
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select label="Country" value={form.country} onChange={update('country')}>
                      <MenuItem value="India">India</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel>State</InputLabel>
                    <Select
                      label="State"
                      value={strVal(form.state_id)}
                      onChange={(e) => setForm({ ...form, state_id: e.target.value, city_id: "" })}
                    >
                      <MenuItem value=""><em>Choose</em></MenuItem>
                      {states.map((s) => (
                        <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <FormControl size="small" fullWidth>
                    <InputLabel>City</InputLabel>
                    <Select
                      label="City"
                      value={strVal(form.city_id)}
                      onChange={update('city_id')}
                      disabled={!form.state_id}
                    >
                      <MenuItem value=""><em>Choose</em></MenuItem>
                      {cities.map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="text" size="small" onClick={onOpenAddCity}>
                      + Add New City
                    </Button>
                  </Box>
                </Box>

                <TextField
                  size="small"
                  label="GSTIN (TAX No.)"
                  placeholder="GSTIN (TAX No.)"
                  value={form.gstin}
                  onChange={update('gstin')}
                  fullWidth
                />

                <FormControl size="small" fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select label="Assigned To" value={strVal(form.assigned_to)} onChange={update('assigned_to')}>
                    <MenuItem value=""><em>Choose</em></MenuItem>
                    {users.map((u) => (
                      <MenuItem key={u.id} value={String(u.id)}>{u.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  type="date"
                  label="Expected Close Date"
                  value={form.expected_close_date}
                  onChange={update('expected_close_date')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />

                <TextField
                  size="small"
                  type="number"
                  label="Expected Value"
                  value={form.expected_value}
                  onChange={update('expected_value')}
                  slotProps={{ htmlInput: { step: 0.01 } }}
                  fullWidth
                />

                <TextField
                  size="small"
                  type="number"
                  label="Budget"
                  placeholder="Enter budget"
                  value={form.budget}
                  onChange={update('budget')}
                  slotProps={{ htmlInput: { step: 0.01 } }}
                  fullWidth
                />

                <FormControl size="small" fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select label="Priority" value={form.priority} onChange={update('priority')}>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel>Tags</InputLabel>
                  <Select
                    multiple
                    label="Tags"
                    value={(form.tags || []).map(String)}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    renderValue={(selected) =>
                      tags
                        .filter((t) => selected.includes(String(t.id)))
                        .map((t) => t.name)
                        .join(", ")
                    }
                  >
                    {tags.map((t) => (
                      <MenuItem key={t.id} value={String(t.id)}>
                        <Checkbox checked={(form.tags || []).map(String).includes(String(t.id))} size="small" />
                        <ListItemText primary={t.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {form.lead_type === "business" && (
                  <>
                    <TextField
                      size="small"
                      label="Industry"
                      placeholder="Industry"
                      value={form.industry}
                      onChange={update('industry')}
                      fullWidth
                    />
                    <FormControl size="small" fullWidth>
                      <InputLabel>Company Size</InputLabel>
                      <Select label="Company Size" value={form.company_size} onChange={update('company_size')}>
                        <MenuItem value=""><em>Choose</em></MenuItem>
                        <MenuItem value="Small">Small</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="Large">Large</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                )}

                <TextField
                  size="small"
                  label="Notes"
                  placeholder="Internal notes"
                  value={form.notes}
                  onChange={update('notes')}
                  multiline
                  rows={4}
                  fullWidth
                  sx={fullSpanSx}
                />
              </Box>
            </Collapse>

            {err && (
              <Alert severity="error" sx={{ ...fullSpanSx, borderRadius: 2 }}>
                {err}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add City Modal */}
      <Dialog
        open={showAddCity}
        onClose={handleAddCityClose}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Add City
          </Typography>
          <IconButton size="small" onClick={onCloseAddCity} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <TextField
            size="small"
            label="City Name"
            placeholder="Enter city name"
            value={newCityName}
            onChange={(e) => setNewCityName(e.target.value)}
            autoFocus
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={onCloseAddCity} disabled={addingCity}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onSaveCity}
            disabled={addingCity}
            startIcon={addingCity ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {addingCity ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
