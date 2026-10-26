import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { whatsappApi } from "../services/whatsapp";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  return [];
};

const dialogPaperSx = {
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.12)',
};

export default function WhatsAppSendModal({ show, onHide, toNumber, toName, contextType, contextId }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [messageType, setMessageType] = useState("template"); // template | freeform
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [templateVars, setTemplateVars] = useState({});

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await whatsappApi.getTemplates();
      setTemplates(toArray(res.data?.data ?? res.data));
    } catch {
      toast.error("Failed to load WhatsApp templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    loadTemplates();
    const reset = setTimeout(() => {
      setSelectedTemplate("");
      setFreeText("");
      setTemplateVars({});
      setMessageType("template");
    }, 0);
    return () => clearTimeout(reset);
  }, [show, loadTemplates]);

  const handleTemplateChange = (templateName) => {
    setSelectedTemplate(templateName);
    const tmpl = templates.find(t => t.name === templateName);
    if (tmpl?.components) {
      const vars = {};
      tmpl.components.forEach((comp, ci) => {
        if (comp.type === "BODY" && comp.example?.body_text) {
          comp.example.body_text[0]?.forEach((_, vi) => {
            vars[`${ci}_${vi}`] = "";
          });
        }
      });
      setTemplateVars(vars);
    }
  };

  const handleSend = async () => {
    if (!toNumber) { toast.warning("No phone number available"); return; }

    const payload = {
      to: toNumber,
      type: messageType,
      context_type: contextType,
      context_id: contextId,
    };

    if (messageType === "template") {
      if (!selectedTemplate) { toast.warning("Select a template"); return; }
      payload.template_name = selectedTemplate;
      const vars = Object.values(templateVars);
      if (vars.some(v => !v.trim())) { toast.warning("Fill all template variables"); return; }
      payload.variables = vars;
    } else {
      if (!freeText.trim()) { toast.warning("Enter a message"); return; }
      payload.text = freeText.trim();
    }

    try {
      setSending(true);
      await whatsappApi.sendMessage(payload);
      toast.success(`WhatsApp sent to ${toName || toNumber}`);
      onHide();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to send WhatsApp");
    } finally {
      setSending(false);
    }
  };

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    onHide();
  };

  const selectedTmpl = templates.find(t => t.name === selectedTemplate);

  return (
    <Dialog
      open={show}
      onClose={handleDialogClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      slotProps={{ paper: { sx: dialogPaperSx } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <i className="fab fa-whatsapp" style={{ color: '#22c55e', fontSize: 18 }} aria-hidden="true" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Send WhatsApp{toName ? ` to ${toName}` : ""}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onHide} aria-label="Close">
          <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gap: 2.5 }}>
          <TextField
            size="small"
            label="To"
            value={toNumber || "—"}
            disabled
            fullWidth
          />

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: .5 }}>
              Message Type
            </Typography>
            <RadioGroup row value={messageType} onChange={(e) => setMessageType(e.target.value)}>
              <FormControlLabel value="template" control={<Radio size="small" />} label="Template" />
              <FormControlLabel value="freeform" control={<Radio size="small" />} label="Free Text" />
            </RadioGroup>
          </Box>

          {messageType === "template" && (
            <>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, color: 'text.secondary' }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">Loading templates...</Typography>
                </Box>
              ) : (
                <FormControl size="small" fullWidth>
                  <InputLabel>Template *</InputLabel>
                  <Select
                    label="Template *"
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                  >
                    <MenuItem value=""><em>Select a template...</em></MenuItem>
                    {templates.map(t => (
                      <MenuItem key={t.name} value={t.name}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{t.name}</span>
                          {t.status && <Chip label={t.status} size="small" color="info" variant="outlined" />}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1.5 }}>
                Only approved templates can be used for the first message.
              </Typography>

              {selectedTmpl && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#f8fafc',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {selectedTmpl.name}
                  </Typography>
                  {selectedTmpl.components?.map((comp, ci) => (
                    <Box key={ci} sx={{ mb: 1 }}>
                      {comp.type === "HEADER" && (
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {comp.text}
                        </Typography>
                      )}
                      {comp.type === "BODY" && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }} component="div">
                          {comp.text?.split(/\{\{\d+\}\}/).map((part, i) => (
                            <Box component="span" key={i}>
                              {part}
                              {i < (comp.text.match(/\{\{\d+\}\}/g) || []).length && (
                                <TextField
                                  size="small"
                                  placeholder={`var ${i + 1}`}
                                  value={templateVars[`${ci}_${i}`] || ""}
                                  onChange={e => setTemplateVars(prev => ({ ...prev, [`${ci}_${i}`]: e.target.value }))}
                                  sx={{ width: 120, mx: 0.5, display: 'inline-flex', verticalAlign: 'middle' }}
                                  slotProps={{ htmlInput: { style: { padding: '4px 8px', fontSize: 13 } } }}
                                />
                              )}
                            </Box>
                          ))}
                        </Typography>
                      )}
                      {comp.type === "FOOTER" && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {comp.text}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}

          {messageType === "freeform" && (
            <TextField
              size="small"
              label="Message"
              required
              multiline
              rows={4}
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              placeholder="Type your message..."
              slotProps={{ htmlInput: { maxLength: 4096 } }}
              helperText={`${freeText.length}/4096`}
              fullWidth
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onHide} disabled={sending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleSend}
          disabled={sending || (messageType === "template" && !selectedTemplate) || (messageType === "freeform" && !freeText.trim())}
          startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <i className="fab fa-whatsapp" aria-hidden="true" />}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}
