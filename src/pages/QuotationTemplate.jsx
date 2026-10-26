import { useState, useEffect, useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import api from "../api";

const COVER_VARIABLES = [
  { key: "{company_name}", label: "Company Name" },
  { key: "{company_address}", label: "Company Address" },
  { key: "{company_phone}", label: "Company Phone" },
  { key: "{company_email}", label: "Company Email" },
  { key: "{company_gstin}", label: "Company GSTIN" },
  { key: "{customer_name}", label: "Customer Name" },
  { key: "{customer_address}", label: "Customer Address" },
  { key: "{customer_phone}", label: "Customer Phone" },
  { key: "{quotation_number}", label: "Quotation No" },
  { key: "{quotation_date}", label: "Quotation Date" },
  { key: "{valid_until}", label: "Valid Until" },
  { key: "{title}", label: "Cover Title" },
];

const DEFAULT_SECTIONS = [
  { key: "cover", title: "", label: "Cover Page", enabled: true, content: "", image: "", bg_color: "#228B22", text_color: "#ffffff", middle_bg_color: "#000000", middle_text_color: "#ffffff", price_text: "", show_customer_info: true, show_company_info: true, show_date: true, show_header: true, show_footer: true },
  { key: "about", title: "About Us", label: "About Us", enabled: true, content: "" },
  { key: "photos", title: "Our Work / Photos", label: "Photo Gallery", enabled: true, content: "" },
  { key: "details", title: "Quotation Details", label: "Quotation Details", enabled: true, content: "" },
  { key: "terms", title: "Terms & Conditions", label: "Terms & Conditions", enabled: true, content: "" },
  { key: "testimonials", title: "What Our Clients Say", label: "Testimonials", enabled: true, content: "" },
  { key: "thanks", title: "", label: "Thank You", enabled: true, content: "" },
];

const PREVIEW_SAMPLE = {
  customer_name: "Customer Name",
  customer_address: "Customer Address, City",
  quotation_number: "Q-001",
  quotation_date: "11/09/2026",
  valid_until: "18/09/2026",
};

const toolbarBtnSx = {
  minWidth: 28,
  height: 26,
  px: .75,
  borderRadius: 1,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: '#fff',
  color: 'text.secondary',
  fontSize: 11,
  lineHeight: 1,
  '&:hover': { bgcolor: 'rgba(145,158,171,.12)', color: 'text.primary' },
  '&.Mui-disabled': { borderColor: 'divider' },
};

const RichTextEditor = forwardRef(function RichTextEditor(
  { value, onChange, disabled, placeholder },
  ref
) {
  const editorRef = useRef(null);
  const lastHtml = useRef(value || "");

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || "";
      lastHtml.current = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== lastHtml.current) {
      editorRef.current.innerHTML = value || "";
      lastHtml.current = value || "";
    }
  }, [value]);

  const emit = () => {
    const html = editorRef.current ? editorRef.current.innerHTML : "";
    lastHtml.current = html;
    onChange(html);
  };

  const exec = (command, arg = null) => {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const insertHTML = (html) => {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    emit();
  };

  const insertTable = () => {
    const rows = parseInt(window.prompt("Number of rows?", "2"), 10);
    const cols = parseInt(window.prompt("Number of columns?", "2"), 10);
    if (!rows || !cols || rows < 1 || cols < 1 || rows > 20 || cols > 8) return;
    let html =
      '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:11px;"><tbody>';
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) {
        html += r === 0
          ? '<td style="border:1px solid #d1d5db;font-weight:700;">&nbsp;</td>'
          : '<td style="border:1px solid #d1d5db;">&nbsp;</td>';
      }
      html += "</tr>";
    }
    html += "</tbody></table><p><br></p>";
    insertHTML(html);
  };

  const insertImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 700;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        insertHTML(
          `<img src="${dataUrl}" style="max-width:100%;" /><p><br></p>`
        );
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const insertPageBreak = () => {
    insertHTML(
      '<div class="page-break" style="page-break-before:always;border-top:2px dashed #94a3b8;margin:10px 0;font-size:9px;color:#94a3b8;text-align:center;">— page break —</div><p><br></p>'
    );
  };

  useImperativeHandle(ref, () => ({
    insertText: (text) => {
      if (disabled) return;
      editorRef.current?.focus();
      document.execCommand("insertText", false, text);
      emit();
    },
  }));

  const btn = (command, icon, title) => (
    <Tooltip key={command + icon} title={title}>
      <span>
        <IconButton
          size="small"
          disabled={disabled}
          sx={toolbarBtnSx}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec(command)}
          aria-label={title}
        >
          <i className={`fas ${icon}`} aria-hidden="true" />
        </IconButton>
      </span>
    </Tooltip>
  );

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: '#fff', overflow: 'hidden' }}>
      <style>{`.rte-area:empty::before{content:attr(data-placeholder);color:#9ca3af;}`}</style>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: .5, borderBottom: '1px solid', borderColor: 'divider', px: 1, py: .75, bgcolor: '#f8fafc' }}>
        {btn("bold", "fa-bold", "Bold")}
        {btn("italic", "fa-italic", "Italic")}
        {btn("underline", "fa-underline", "Underline")}
        {btn("strikeThrough", "fa-strikethrough", "Strikethrough")}
        {btn("insertUnorderedList", "fa-list-ul", "Bullet list")}
        {btn("insertOrderedList", "fa-list-ol", "Numbered list")}
        <Box
          component="input"
          type="color"
          title="Text color"
          disabled={disabled}
          onChange={(e) => exec("foreColor", e.target.value)}
          sx={{ width: 30, height: 26, p: '2px', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: '#fff', cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
        <Tooltip title="Insert table">
          <span>
            <IconButton
              size="small"
              disabled={disabled}
              sx={toolbarBtnSx}
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertTable}
              aria-label="Insert table"
            >
              <i className="fas fa-table" aria-hidden="true" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Insert image">
          <IconButton
            component="label"
            size="small"
            disabled={disabled}
            sx={toolbarBtnSx}
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Insert image"
          >
            <i className="fas fa-image" aria-hidden="true" />
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={disabled}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) insertImage(file);
                e.target.value = "";
              }}
            />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert page break">
          <span>
            <IconButton
              size="small"
              disabled={disabled}
              sx={toolbarBtnSx}
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertPageBreak}
              aria-label="Insert page break"
            >
              <i className="fas fa-file-export" aria-hidden="true" />
            </IconButton>
          </span>
        </Tooltip>
        {btn("removeFormat", "fa-eraser", "Clear formatting")}
      </Box>
      <Box
        component="div"
        ref={editorRef}
        className="rte-area"
        sx={{ p: 1.25, fontSize: 13, minHeight: 80, outline: 'none' }}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
      />
    </Box>
  );
});

const BG_PRESETS = ["#228B22", "#0d6efd", "#6f42c1", "#d63384", "#dc3545", "#fd7e14", "#198754", "#212529"];
const MIDBG_PRESETS = ["#000000", "#212529", "#343a40", "#0d6efd", "#ffffff"];
const TEXT_PRESETS = ["#ffffff", "#000000", "#f8f9fa", "#ffc107"];

function ColorField({ label, value, onChange, disabled, presets }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mb: .75 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: .75, flexWrap: 'wrap' }}>
        <Box
          component="input"
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          sx={{
            height: 30,
            width: 42,
            p: '2px',
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
        {presets.map((c) => (
          <Box
            key={c}
            component="button"
            type="button"
            title={c}
            disabled={disabled}
            onClick={() => onChange(c)}
            sx={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: c,
              border: value === c ? '2px solid #6528e8' : '1px solid #ced4da',
              cursor: disabled ? 'not-allowed' : 'pointer',
              p: 0,
              flexShrink: 0,
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

const CONTENT_SECTIONS = {
  about: {
    label: "About text",
    placeholder: "Write about your company, mission, experience...",
    hint: "Shown below the title banner on the About page.",
  },
  terms: {
    label: "Terms & Conditions",
    placeholder: "e.g. 1. Payment within 15 days of invoice...",
    hint: "Use the list buttons for numbered or bullet points.",
  },
  testimonials: {
    label: "Testimonials",
    placeholder: "Write client testimonials...",
    hint: "Leave empty to show the default sample testimonials.",
  },
  thanks: {
    label: "Thank you message",
    placeholder: "e.g. We appreciate the opportunity to serve you...",
    hint: "Leave empty for the default message.",
  },
};

function CoverPreview({ section, settings }) {
  const s = section || {};
  const vars = {
    "{company_name}": settings.company_name || "Your Company",
    "{company_address}": settings.company_address || "Company Address",
    "{company_phone}": settings.company_phone || "",
    "{company_email}": settings.company_email || "",
    "{company_gstin}": settings.company_gstin || "",
    "{customer_name}": PREVIEW_SAMPLE.customer_name,
    "{customer_address}": PREVIEW_SAMPLE.customer_address,
    "{customer_phone}": "",
    "{quotation_number}": PREVIEW_SAMPLE.quotation_number,
    "{quotation_date}": PREVIEW_SAMPLE.quotation_date,
    "{valid_until}": PREVIEW_SAMPLE.valid_until,
    "{title}": s.title || "Roof Top Solar Proposal",
  };
  const replace = (text) => {
    let out = text || "";
    Object.entries(vars).forEach(([k, v]) => {
      out = out.split(k).join(v);
    });
    return out;
  };
  const headline = replace(s.title) || "Roof Top Solar Proposal";
  const tagline = replace(s.content);
  const priceText = replace(s.price_text);
  const bg = s.bg_color || "#228B22";
  const text = s.text_color || "#ffffff";
  const midBg = s.middle_bg_color || "#000000";
  const midText = s.middle_text_color || "#ffffff";
  const logo = settings.logo || "";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 320,
        aspectRatio: "210/297",
        border: "1px solid #dee2e6",
        borderRadius: 6,
        overflow: "hidden",
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
        background: "#fff",
        display: "flex",
        fontFamily: "DejaVu Sans, sans-serif",
      }}
    >
      <div
        style={{
          width: "50%",
          background: "#f3f4f6",
          borderRight: "3px solid #fff",
          flexShrink: 0,
        }}
      >
        {s.image ? (
          <img
            src={s.image}
            alt="cover"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: 11,
            }}
          >
            Cover image
          </div>
        )}
      </div>
      <div
        style={{
          width: "50%",
          background: bg,
          color: text,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          borderLeft: "3px solid #fff",
        }}
      >
        <div
          style={{
            height: "23.6%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 10px",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          {logo && (
            <img
              src={logo}
              alt="logo"
              style={{ maxHeight: 22, maxWidth: 70, margin: "0 auto 6px", display: "block" }}
            />
          )}
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              lineHeight: 1.15,
              wordBreak: "break-word",
            }}
          >
            {headline}
          </div>
          <div
            style={{
              width: 26,
              height: 2,
              background: "rgba(255,255,255,0.5)",
              margin: "6px auto",
            }}
          />
        </div>
        <div
          style={{
            height: "47.3%",
            background: midBg,
            color: midText,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 10px",
            overflow: "hidden",
          }}
        >
          {s.show_customer_info && (
            <div>
              <div
                style={{
                  fontSize: 7,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  opacity: 0.75,
                  marginBottom: 3,
                }}
              >
                Proposal to
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, lineHeight: 1.2 }}>
                {PREVIEW_SAMPLE.customer_name}
              </div>
              <div style={{ fontSize: 7, opacity: 0.85, lineHeight: 1.4 }}>
                {PREVIEW_SAMPLE.customer_address}
              </div>
              {priceText && (
                <div
                  style={{
                    display: "inline-block",
                    marginTop: 6,
                    padding: "3px 8px",
                    background: "rgba(255,255,255,0.16)",
                    borderRadius: 999,
                    fontSize: 8,
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  {priceText}
                </div>
              )}
            </div>
          )}
        </div>
        <div
          style={{
            height: "20.3%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "8px 10px",
            fontSize: 7,
            overflow: "hidden",
          }}
        >
          {s.show_company_info && (
            <div style={{ marginBottom: 6 }}>
              {logo && (
                <img
                  src={logo}
                  alt="logo"
                  style={{ maxHeight: 14, maxWidth: 50, marginBottom: 3, display: "block" }}
                />
              )}
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {settings.company_name || "Your Company"}
              </div>
              <div style={{ opacity: 0.85, lineHeight: 1.4 }}>
                {settings.company_address || "Company Address"}
              </div>
              {(settings.company_phone || settings.company_email) && (
                <div style={{ opacity: 0.8, marginTop: 1 }}>
                  {settings.company_phone}
                  {settings.company_phone && settings.company_email ? " · " : ""}
                  {settings.company_email}
                </div>
              )}
            </div>
          )}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.25)",
              paddingTop: 3,
              marginBottom: 3,
            }}
          >
            {s.show_date && (
              <span style={{ marginRight: 6 }}>
                <strong>Date:</strong> {PREVIEW_SAMPLE.quotation_date}
              </span>
            )}
            <span>
              <strong>Quotation No:</strong> {PREVIEW_SAMPLE.quotation_number}
            </span>
          </div>
          {tagline && (
            <div
              style={{
                opacity: 0.8,
                borderTop: "1px solid rgba(255,255,255,0.2)",
                paddingTop: 3,
                lineHeight: 1.4,
              }}
              dangerouslySetInnerHTML={{ __html: tagline }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const pageCardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const fieldLabelSx = {
  display: 'block',
  color: 'text.secondary',
  fontWeight: 700,
  fontSize: 12,
  mb: .75,
};

const sectionHeadingSx = {
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  color: 'text.secondary',
  display: 'flex',
  alignItems: 'center',
  gap: .75,
  mb: 1.5,
};

export default function QuotationTemplate() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [invoiceSettings, setInvoiceSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const coverRef = useRef(null);

  const coverIndex = useMemo(
    () => sections.findIndex((s) => s.key === "cover"),
    [sections]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/quotation-template");
      const data = res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        const labels = {};
        DEFAULT_SECTIONS.forEach((s) => (labels[s.key] = s.label));
        setSections(
          data.map((s) => ({
            ...s,
            label: labels[s.key] || s.key,
            content: s.content ?? "",
            image: s.image ?? "",
            bg_color: s.bg_color ?? (s.key === "cover" ? "#228B22" : ""),
            text_color: s.text_color ?? (s.key === "cover" ? "#ffffff" : ""),
            middle_bg_color: s.middle_bg_color ?? (s.key === "cover" ? "#000000" : ""),
            middle_text_color: s.middle_text_color ?? (s.key === "cover" ? "#ffffff" : ""),
            price_text: s.price_text ?? "",
            photos: Array.isArray(s.photos) ? s.photos : [],
            show_customer_info: s.show_customer_info ?? true,
            show_company_info: s.show_company_info ?? true,
            show_date: s.show_date ?? true,
            show_header: s.show_header ?? true,
            show_footer: s.show_footer ?? true,
          }))
        );
      }
      try {
        const settingsRes = await api.get("/invoice-settings");
        setInvoiceSettings(settingsRes.data?.data || {});
      } catch {
        // ignore
      }
    } catch {
      toast.error("Failed to load quotation template");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const update = (index, field, value) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleImageChange = (index, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const targetW = 620;
        const targetH = 1754;
        const targetAspect = targetW / targetH;
        const srcW = img.width;
        const srcH = img.height;
        const srcAspect = srcW / srcH;
        let cropW, cropH, sx, sy;
        if (srcAspect > targetAspect) {
          cropH = srcH;
          cropW = Math.round(srcH * targetAspect);
          sx = Math.round((srcW - cropW) / 2);
          sy = 0;
        } else {
          cropW = srcW;
          cropH = Math.round(srcW / targetAspect);
          sx = 0;
          sy = Math.round((srcH - cropH) / 2);
        }
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, targetW, targetH);
        update(index, "image", canvas.toDataURL("image/jpeg", 0.9));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAboutImage = (index, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const targetW = 1200;
        const targetH = 450;
        const targetAspect = targetW / targetH;
        const srcW = img.width;
        const srcH = img.height;
        const srcAspect = srcW / srcH;
        let cropW, cropH, sx, sy;
        if (srcAspect > targetAspect) {
          cropH = srcH;
          cropW = Math.round(srcH * targetAspect);
          sx = Math.round((srcW - cropW) / 2);
          sy = 0;
        } else {
          cropW = srcW;
          cropH = Math.round(srcW / targetAspect);
          sx = 0;
          sy = Math.round((srcH - cropH) / 2);
        }
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, targetW, targetH);
        update(index, "image", canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoChange = (index, slot, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const targetW = 800;
        const targetH = 600;
        const targetAspect = targetW / targetH;
        const srcW = img.width;
        const srcH = img.height;
        const srcAspect = srcW / srcH;
        let cropW, cropH, sx, sy;
        if (srcAspect > targetAspect) {
          cropH = srcH;
          cropW = Math.round(srcH * targetAspect);
          sx = Math.round((srcW - cropW) / 2);
          sy = 0;
        } else {
          cropW = srcW;
          cropH = Math.round(srcW / targetAspect);
          sx = 0;
          sy = Math.round((srcH - cropH) / 2);
        }
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, targetW, targetH);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setSections((prev) =>
          prev.map((s, i) => {
            if (i !== index) return s;
            const photos = [...(Array.isArray(s.photos) ? s.photos : [])];
            photos[slot] = dataUrl;
            return { ...s, photos };
          })
        );
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (index, slot) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const photos = [...(Array.isArray(s.photos) ? s.photos : [])];
        photos[slot] = "";
        return { ...s, photos };
      })
    );
  };

  const resetDefaults = () => {
    if (!window.confirm("Reset all sections to default titles, colors and content?")) return;
    setSections(DEFAULT_SECTIONS.map((s) => ({ ...s })));
    toast.info("Reset to defaults — click Save Template to apply");
  };

  const insertVariable = (token) => {
    if (coverIndex < 0) return;
    if (coverRef.current?.insertText) {
      coverRef.current.insertText(token);
    } else {
      update(coverIndex, "content", (sections[coverIndex].content ?? "") + token);
    }
  };

  const onDragStart = (index) => setDraggingIndex(index);
  const onDragEnter = (index) => setDragOverIndex(index);
  const onDragOver = (e) => e.preventDefault();
  const onDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };
  const onDrop = (e, index) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === index) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      return;
    }
    setSections((prev) => {
      const newArr = [...prev];
      const [moved] = newArr.splice(draggingIndex, 1);
      newArr.splice(index, 0, moved);
      return newArr;
    });
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload = sections.map((s) => ({
        key: s.key,
        title: s.title,
        content: s.content ?? "",
        image: s.image ?? "",
        bg_color: s.bg_color ?? "",
        text_color: s.text_color ?? "",
        middle_bg_color: s.middle_bg_color ?? "",
        middle_text_color: s.middle_text_color ?? "",
        price_text: s.price_text ?? "",
        photos: Array.isArray(s.photos) ? s.photos : [],
        show_customer_info: !!s.show_customer_info,
        show_company_info: !!s.show_company_info,
        show_date: !!s.show_date,
        enabled: !!s.enabled,
      }));
      await api.post("/quotation-template", { value: payload });
      if (invoiceSettings.theme_color) {
        await api.post("/invoice-settings", {
          ...invoiceSettings,
          theme_color: invoiceSettings.theme_color,
        });
      }
      toast.success("Quotation template saved");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3 }}>
        <Box>
          <Card sx={{ ...pageCardSx, height: '100%' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2, px: 3, py: 2.5 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>Quotation Template Designer</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Drag &amp; drop pages to reorder, edit titles, or show/hide sections.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" onClick={resetDefaults} disabled={saving} startIcon={<i className="fas fa-undo" aria-hidden="true" />}>
                  Reset
                </Button>
                <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <i className="fas fa-save" aria-hidden="true" />}>
                  Save Template
                </Button>
              </Stack>
            </Box>
            <Divider />
            <Box sx={{ bgcolor: '#f8fafc', px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                <i className="fas fa-info-circle" style={{ marginRight: 6 }} aria-hidden="true" />
                The order below is the order in the PDF. Cover &amp; Thank You titles are optional.
              </Typography>
            </Box>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <ColorField
                label="PDF theme color (headings, table headers, accents)"
                value={invoiceSettings.theme_color ?? "#1e3a5f"}
                onChange={(v) =>
                  setInvoiceSettings((prev) => ({ ...prev, theme_color: v }))
                }
                disabled={saving}
                presets={["#1e3a5f", "#228B22", "#0d6efd", "#6f42c1", "#dc3545", "#fd7e14", "#198754", "#111827"]}
              />
            </Box>
            <Box>
              {sections.map((section, index) => {
                const icon = {
                  cover: "fa-file",
                  about: "fa-building",
                  photos: "fa-images",
                  details: "fa-list-alt",
                  terms: "fa-file-signature",
                  testimonials: "fa-quote-right",
                  thanks: "fa-hand-holding-heart",
                }[section.key];

                const disabled = !section.enabled;
                const isCover = section.key === "cover";
                return (
                  <Box
                    key={section.key}
                    component="div"
                    draggable
                    onDragStart={() => onDragStart(index)}
                    onDragEnter={() => onDragEnter(index)}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                    onDrop={(e) => onDrop(e, index)}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      p: 2.5,
                      cursor: 'move',
                      transition: 'all 0.15s ease',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      opacity: draggingIndex === index ? .5 : 1,
                      bgcolor: dragOverIndex === index ? '#f4f6f8' : disabled ? '#fafbfc' : 'transparent',
                      borderLeft: '4px solid',
                      borderLeftColor: dragOverIndex === index ? 'primary.main' : 'transparent',
                    }}
                  >
                    <Box sx={{ color: 'text.secondary', fontSize: 18, pt: .5 }}>
                      <i className="fas fa-grip-vertical" aria-hidden="true" />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '50%',
                        bgcolor: '#eaf0f6',
                        color: 'primary.main',
                        border: '1px solid',
                        borderColor: 'divider',
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                      }}
                    >
                      <i className={`fas ${icon}`} aria-hidden="true" />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{section.label}</Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={!!section.enabled}
                              onChange={(e) => update(index, "enabled", e.target.checked)}
                            />
                          }
                          label="Show"
                          sx={{ m: 0 }}
                        />
                      </Box>
                      <TextField
                        size="small"
                        fullWidth
                        value={section.title}
                        onChange={(e) => update(index, "title", e.target.value)}
                        placeholder={`${section.label} title`}
                        disabled={disabled}
                      />
                      {section.key === "about" && (
                        <Box sx={{ mt: 2 }}>
                          <Typography sx={fieldLabelSx}>
                            Hero image (top of About page)
                          </Typography>
                          <Button
                            component="label"
                            variant="outlined"
                            size="small"
                            disabled={disabled}
                            startIcon={<i className="fas fa-upload" aria-hidden="true" />}
                          >
                            Choose image
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              disabled={disabled}
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) handleAboutImage(index, file);
                                e.target.value = "";
                              }}
                            />
                          </Button>
                          {section.image && (
                            <Box sx={{ mt: 1.5 }}>
                              <img
                                src={section.image}
                                alt="About hero"
                                style={{ maxHeight: 80, maxWidth: "100%", borderRadius: 8, border: '1px solid rgba(145,158,171,.32)' }}
                              />
                              <Box sx={{ mt: .5 }}>
                                <Button
                                  variant="text"
                                  size="small"
                                  color="error"
                                  sx={{ p: 0, minWidth: 0 }}
                                  onClick={() => update(index, "image", "")}
                                >
                                  Remove image
                                </Button>
                              </Box>
                            </Box>
                          )}
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: .75 }}>
                            Wide photo works best — auto-cropped to a banner shape.
                          </Typography>
                        </Box>
                      )}
                      {section.key === "photos" && (
                        <Box sx={{ mt: 2 }}>
                          <Typography sx={fieldLabelSx}>
                            Gallery photos (up to 4)
                          </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                            {[0, 1, 2, 3].map((slot) => {
                              const photo = section.photos?.[slot];
                              return (
                                <Box key={slot}>
                                  {photo ? (
                                    <Box sx={{ position: 'relative', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                                      <img
                                        src={photo}
                                        alt={`Photo ${slot + 1}`}
                                        style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }}
                                      />
                                      <IconButton
                                        size="small"
                                        sx={{
                                          position: 'absolute',
                                          top: 2,
                                          right: 2,
                                          width: 20,
                                          height: 20,
                                          bgcolor: 'error.main',
                                          color: '#fff',
                                          fontSize: 10,
                                          '&:hover': { bgcolor: 'error.dark' },
                                        }}
                                        onClick={() => removePhoto(index, slot)}
                                        disabled={disabled}
                                        aria-label={`Remove photo ${slot + 1}`}
                                      >
                                        <i className="fas fa-times" aria-hidden="true" />
                                      </IconButton>
                                    </Box>
                                  ) : (
                                    <Box
                                      component="label"
                                      sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: 80,
                                        border: '1px dashed',
                                        borderColor: 'divider',
                                        borderRadius: 1.5,
                                        color: 'text.secondary',
                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                        fontSize: 11,
                                        '&:hover': disabled ? {} : { bgcolor: 'rgba(145,158,171,.08)' },
                                      }}
                                    >
                                      <i className="fas fa-plus" style={{ marginBottom: 4 }} aria-hidden="true" />
                                      Photo {slot + 1}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        disabled={disabled}
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) handlePhotoChange(index, slot, file);
                                          e.target.value = "";
                                        }}
                                      />
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: .75 }}>
                            Photos are auto-cropped to fit the gallery boxes.
                          </Typography>
                        </Box>
                      )}
                      {!isCover && CONTENT_SECTIONS[section.key] && (
                        <Box sx={{ mt: 2 }}>
                          <Typography sx={fieldLabelSx}>
                            {CONTENT_SECTIONS[section.key].label}
                          </Typography>
                          <RichTextEditor
                            value={section.content ?? ""}
                            onChange={(html) => update(index, "content", html)}
                            placeholder={CONTENT_SECTIONS[section.key].placeholder}
                            disabled={disabled}
                          />
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: .75 }}>
                            {CONTENT_SECTIONS[section.key].hint}
                          </Typography>
                        </Box>
                      )}
                      {isCover && (
                        <Box sx={{ mt: 2.5 }}>
                          <Typography sx={sectionHeadingSx}>
                            <i className="fas fa-palette" aria-hidden="true" />Colors
                          </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 2.5 }}>
                            <ColorField
                              label="Background"
                              value={section.bg_color ?? "#228B22"}
                              onChange={(v) => update(index, "bg_color", v)}
                              disabled={disabled}
                              presets={BG_PRESETS}
                            />
                            <ColorField
                              label="Text"
                              value={section.text_color ?? "#ffffff"}
                              onChange={(v) => update(index, "text_color", v)}
                              disabled={disabled}
                              presets={TEXT_PRESETS}
                            />
                            <ColorField
                              label="Middle band"
                              value={section.middle_bg_color ?? "#000000"}
                              onChange={(v) => update(index, "middle_bg_color", v)}
                              disabled={disabled}
                              presets={MIDBG_PRESETS}
                            />
                            <ColorField
                              label="Middle text"
                              value={section.middle_text_color ?? "#ffffff"}
                              onChange={(v) => update(index, "middle_text_color", v)}
                              disabled={disabled}
                              presets={TEXT_PRESETS}
                            />
                          </Box>
                          <Typography sx={sectionHeadingSx}>
                            <i className="fas fa-image" aria-hidden="true" />Cover image
                          </Typography>
                          <Box sx={{ mb: 2.5 }}>
                            <Button
                              component="label"
                              variant="outlined"
                              size="small"
                              disabled={disabled}
                              startIcon={<i className="fas fa-upload" aria-hidden="true" />}
                            >
                              Choose image
                              <input
                                type="file"
                                accept="image/*"
                                hidden
                                disabled={disabled}
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handleImageChange(index, file);
                                  e.target.value = "";
                                }}
                              />
                            </Button>
                            {section.image && (
                              <Box sx={{ mt: 1.5 }}>
                                <img
                                  src={section.image}
                                  alt="Cover preview"
                                  style={{ maxHeight: 140, maxWidth: "100%", borderRadius: 8, border: '1px solid rgba(145,158,171,.32)' }}
                                />
                                <Box sx={{ mt: .5 }}>
                                  <Button
                                    variant="text"
                                    size="small"
                                    color="error"
                                    sx={{ p: 0, minWidth: 0 }}
                                    onClick={() => update(index, "image", "")}
                                  >
                                    Remove image
                                  </Button>
                                </Box>
                              </Box>
                            )}
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: .75 }}>
                              Image is auto-cropped from the center to fit the left side. Upload any photo.
                            </Typography>
                          </Box>
                          <Box sx={{ mb: 2.5 }}>
                            <Typography sx={fieldLabelSx}>
                              Price / Offer text
                            </Typography>
                            <TextField
                              size="small"
                              fullWidth
                              value={section.price_text ?? ""}
                              onChange={(e) =>
                                update(index, "price_text", e.target.value)
                              }
                              placeholder="e.g. મેળવો ₹.78,000/- સૂર્યની સબસીડી"
                              disabled={disabled}
                            />
                          </Box>
                          <Box sx={{ mb: 2.5 }}>
                            <Typography sx={fieldLabelSx}>
                              Tagline / Footer text
                            </Typography>
                            <RichTextEditor
                              ref={coverRef}
                              value={section.content ?? ""}
                              onChange={(html) =>
                                update(index, "content", html)
                              }
                              placeholder="Type or insert variables..."
                              disabled={disabled}
                            />
                            <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: .75 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Insert:</Typography>
                              {COVER_VARIABLES.map((v) => (
                                <Button
                                  key={v.key}
                                  variant="outlined"
                                  size="small"
                                  sx={{ py: 0, px: 1, fontSize: 11, minHeight: 24 }}
                                  onClick={() => insertVariable(v.key)}
                                >
                                  {v.label}
                                </Button>
                              ))}
                            </Box>
                          </Box>
                          <Typography sx={sectionHeadingSx}>
                            <i className="fas fa-eye" aria-hidden="true" />Show on cover
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={!!section.show_customer_info}
                                  onChange={(e) =>
                                    update(index, "show_customer_info", e.target.checked)
                                  }
                                />
                              }
                              label="Show customer info"
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={!!section.show_company_info}
                                  onChange={(e) =>
                                    update(index, "show_company_info", e.target.checked)
                                  }
                                />
                              }
                              label="Show company info"
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={!!section.show_date}
                                  onChange={(e) =>
                                    update(index, "show_date", e.target.checked)
                                  }
                                />
                              }
                              label="Show date"
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Card>
        </Box>
        <Box>
          <Box sx={{ position: 'sticky', top: 20 }}>
            <Card sx={pageCardSx}>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Live Preview</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Cover page updates as you type</Typography>
              </Box>
              <Divider />
              <CardContent sx={{ display: 'flex', justifyContent: 'center', bgcolor: '#f8fafc', py: 4 }}>
                <CoverPreview section={sections[coverIndex]} settings={invoiceSettings} />
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
