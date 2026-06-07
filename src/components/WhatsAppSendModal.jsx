import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form, Spinner, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { whatsappApi } from "../services/whatsapp";

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
      setTemplates(res.data?.data || []);
    } catch {
      toast.error("Failed to load WhatsApp templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (show) {
      loadTemplates();
      setSelectedTemplate("");
      setFreeText("");
      setTemplateVars({});
      setMessageType("template");
    }
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

  const selectedTmpl = templates.find(t => t.name === selectedTemplate);
  const hasVars = Object.keys(templateVars).length > 0;

  return (
    <Modal show={show} onHide={onHide} backdrop="static" centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fab fa-whatsapp text-success me-2"></i>
          Send WhatsApp{toName ? ` to ${toName}` : ""}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>To</Form.Label>
          <Form.Control value={toNumber || "—"} disabled />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Message Type</Form.Label>
          <div className="d-flex gap-2">
            <Form.Check
              inline
              type="radio"
              label="Template"
              checked={messageType === "template"}
              onChange={() => setMessageType("template")}
            />
            <Form.Check
              inline
              type="radio"
              label="Free Text"
              checked={messageType === "freeform"}
              onChange={() => setMessageType("freeform")}
            />
          </div>
        </Form.Group>

        {messageType === "template" && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Template <span className="text-danger">*</span></Form.Label>
              {loading ? (
                <div className="text-muted small"><Spinner size="sm" className="me-2" />Loading templates...</div>
              ) : (
                <Form.Select value={selectedTemplate} onChange={e => handleTemplateChange(e.target.value)}>
                  <option value="">Select a template...</option>
                  {templates.map(t => (
                    <option key={t.name} value={t.name}>
                      {t.name} {t.status && <Badge bg="info">{t.status}</Badge>}
                    </option>
                  ))}
                </Form.Select>
              )}
              <Form.Text className="text-muted">
                Only approved templates can be used for the first message.
              </Form.Text>
            </Form.Group>

            {selectedTmpl && (
              <div className="mb-3 p-3 bg-light rounded border">
                <div className="fw-semibold small mb-2">{selectedTmpl.name}</div>
                {selectedTmpl.components?.map((comp, ci) => (
                  <div key={ci} className="mb-2">
                    {comp.type === "HEADER" && <div className="fw-semibold small text-primary">{comp.text}</div>}
                    {comp.type === "BODY" && (
                      <div className="small text-secondary">
                        {comp.text?.split(/\{\{\d+\}\}/).map((part, i) => (
                          <span key={i}>
                            {part}
                            {i < (comp.text.match(/\{\{\d+\}\}/g) || []).length && (
                              <Form.Control
                                size="sm"
                                className="d-inline-block mx-1"
                                style={{ width: 120, display: "inline-block" }}
                                placeholder={`var ${i + 1}`}
                                value={templateVars[`${ci}_${i}`] || ""}
                                onChange={e => setTemplateVars(prev => ({ ...prev, [`${ci}_${i}`]: e.target.value }))}
                              />
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {comp.type === "FOOTER" && <div className="small text-muted">{comp.text}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {messageType === "freeform" && (
          <Form.Group className="mb-3">
            <Form.Label>Message <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              placeholder="Type your message..."
              maxLength={4096}
            />
            <Form.Text className="text-muted">{freeText.length}/4096</Form.Text>
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={sending}>Cancel</Button>
        <Button variant="success" onClick={handleSend} disabled={sending || (messageType === "template" && !selectedTemplate) || (messageType === "freeform" && !freeText.trim())}>
          {sending && <Spinner size="sm" className="me-2" />}
          <i className="fab fa-whatsapp me-1"></i> Send
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
