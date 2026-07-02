import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutTemplate, Plus, ChevronDown, Pencil, Trash2,
  X, Save, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { emailTemplateApi, type EmailTemplate } from "../api/emailTemplateApi";

/* -------------------------------------------------------------------------- */
/* Placeholder definitions (inserted when "<" is typed)                        */
/* -------------------------------------------------------------------------- */

export const TICKET_PLACEHOLDERS = [
  { label: "Ticket Number",    value: "{{ticket.tkt_number}}" },
  { label: "Subject",          value: "{{ticket.email_subject}}" },
  { label: "Description",      value: "{{ticket.description}}" },
  { label: "Status",           value: "{{ticket.tkt_status}}" },
  { label: "Type",             value: "{{ticket.tkt_type}}" },
  { label: "Custom Field 1",   value: "{{ticket.tkt_custom1}}" },
  { label: "Custom Field 2",   value: "{{ticket.tkt_custom2}}" },
  { label: "Custom Field 3",   value: "{{ticket.tkt_custom3}}" },
  { label: "Custom Field 4",   value: "{{ticket.tkt_custom4}}" },
  { label: "Custom Field 5",   value: "{{ticket.tkt_custom5}}" },
  { label: "Customer Name",    value: "{{customer.name}}" },
  { label: "Customer Email",   value: "{{customer.email}}" },
  { label: "Customer Mobile",  value: "{{customer.mobile}}" },
  { label: "Agent Name",       value: "{{agent.name}}" },
  { label: "Agent Email",      value: "{{agent.email}}" },
];

/* -------------------------------------------------------------------------- */
/* SmartTextarea — shows placeholder dropdown on "<"                           */
/* -------------------------------------------------------------------------- */

interface SmartTextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function SmartTextarea({ value, onChange, placeholder, rows = 6, className }: SmartTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const [triggerIndex, setTriggerIndex] = useState<number | null>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "<") {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setPickerPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
        setTriggerIndex(el.selectionStart);
        setShowPicker(true);
      } else if (e.key === "Escape") {
        setShowPicker(false);
      }
    },
    []
  );

  const insertPlaceholder = useCallback(
    (placeholder: string) => {
      if (triggerIndex === null) return;
      const before = value.slice(0, triggerIndex);
      const after = value.slice(triggerIndex);
      // Replace the "<" with the placeholder
      const newVal = before + placeholder + after;
      onChange(newVal);
      setShowPicker(false);
      setTriggerIndex(null);
      setTimeout(() => {
        if (ref.current) {
          const pos = triggerIndex + placeholder.length;
          ref.current.selectionStart = pos;
          ref.current.selectionEnd = pos;
          ref.current.focus();
        }
      }, 0);
    },
    [value, onChange, triggerIndex]
  );

  return (
    <div className="relative">
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
        <Info className="h-3 w-3" />
        Type <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">&lt;</kbd> to insert a ticket/customer field placeholder
      </p>

      {showPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
          <div
            className="fixed z-50 bg-popover border rounded-lg shadow-lg w-64 max-h-72 overflow-y-auto"
            style={{ top: pickerPos.top, left: pickerPos.left }}
          >
            <div className="px-3 py-2 border-b text-xs font-medium text-muted-foreground">
              Insert field placeholder
            </div>
            {TICKET_PLACEHOLDERS.map((p) => (
              <button
                key={p.value}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                onMouseDown={(e) => { e.preventDefault(); insertPlaceholder(p.value); }}
              >
                <span>{p.label}</span>
                <span className="text-xs text-muted-foreground font-mono">{p.value}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Template Form Modal                                                         */
/* -------------------------------------------------------------------------- */

interface TemplateFormProps {
  open: boolean;
  onClose: () => void;
  editing?: EmailTemplate | null;
}

function TemplateFormModal({ open, onClose, editing }: TemplateFormProps) {
  const qc = useQueryClient();
  const [name, setName] = useState(editing?.name ?? "");
  const [subject, setSubject] = useState(editing?.subject ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [category, setCategory] = useState<EmailTemplate["category"]>(editing?.category ?? "custom");

  const createMut = useMutation({
    mutationFn: emailTemplateApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-templates"] }); onClose(); },
  });
  const updateMut = useMutation({
    mutationFn: (data: Partial<EmailTemplate>) => emailTemplateApi.update(editing!._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-templates"] }); onClose(); },
  });

  const handleSave = () => {
    const data = { name, subject, body, description, category };
    editing ? updateMut.mutate(data) : createMut.mutate(data);
  };

  const isLoading = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Template" : "New Email Template"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
            <strong>Tip:</strong> Type <kbd className="px-1 bg-muted rounded">&lt;</kbd> in any text field to insert ticket/customer field placeholders (e.g. <code>{"{{customer.name}}"}</code>). These are automatically filled when you use the template on a ticket.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Template Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard Reply" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={category} onValueChange={(v) => setCategory(v as EmailTemplate["category"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["reply", "resolution", "escalation", "follow-up", "custom"] as const).map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="When to use this template" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Subject *</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Re: {{ticket.email_subject}}" />
            <p className="text-xs text-muted-foreground mt-1">Type &lt; to insert field placeholders</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Body *</label>
            <SmartTextarea value={body} onChange={setBody} placeholder="Write your template body here…" rows={10} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleSave} disabled={isLoading || !name || !subject || !body}>
              <Save className="h-4 w-4 mr-1" />
              {isLoading ? "Saving…" : "Save Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Template Table / Manager Dialog                                             */
/* -------------------------------------------------------------------------- */

interface TemplateManagerProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (t: EmailTemplate) => void;
}

function TemplateManager({ open, onClose, onSelect }: TemplateManagerProps) {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => emailTemplateApi.list(),
    enabled: open,
  });

  const deleteMut = useMutation({
    mutationFn: emailTemplateApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });

  const templates = data?.data ?? [];

  const CATEGORY_COLORS: Record<string, string> = {
    reply: "bg-blue-100 text-blue-700",
    resolution: "bg-green-100 text-green-700",
    escalation: "bg-red-100 text-red-700",
    "follow-up": "bg-orange-100 text-orange-700",
    custom: "bg-gray-100 text-gray-700",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Email Templates</DialogTitle>
              <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" />New Template
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <LayoutTemplate className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No templates yet. Create your first one.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2 pl-1">Name</th>
                    <th className="text-left py-2">Subject</th>
                    <th className="text-left py-2">Category</th>
                    <th className="text-right py-2 pr-1">Used</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t._id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pl-1">
                        <div className="font-medium">{t.name}</div>
                        {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                      </td>
                      <td className="py-2.5 text-muted-foreground max-w-50 truncate">{t.subject}</td>
                      <td className="py-2.5">
                        <Badge className={`text-xs ${CATEGORY_COLORS[t.category] ?? ""}`}>{t.category}</Badge>
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground pr-1">{t.use_count}</td>
                      <td className="py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {onSelect && (
                            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => { onSelect(t); onClose(); }}>
                              Use
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditing(t); setFormOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                            onClick={() => { if (confirm("Delete template?")) deleteMut.mutate(t._id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {formOpen && (
        <TemplateFormModal
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          editing={editing}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* EmailTemplateSelector — inline widget for ticket reply                      */
/* -------------------------------------------------------------------------- */

export interface EmailTemplateSelectorProps {
  /** Current reply text — controlled by parent */
  replyText: string;
  onReplyTextChange: (v: string) => void;
  /** Subject controlled by parent (optional) */
  replySubject?: string;
  onReplySubjectChange?: (v: string) => void;
  /** Ticket context for placeholder resolution */
  ticketContext?: Record<string, unknown>;
  customerContext?: Record<string, unknown>;
  agentContext?: Record<string, unknown>;
}

export default function EmailTemplateSelector({
  replyText,
  onReplyTextChange,
  replySubject,
  onReplySubjectChange,
  ticketContext = {},
  customerContext = {},
  agentContext = {},
}: EmailTemplateSelectorProps) {
  const [managerOpen, setManagerOpen] = useState(false);

  const handleSelectTemplate = async (template: EmailTemplate) => {
    // Resolve placeholders client-side (fast path)
    const resolve = (text: string) =>
      text.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_, ns, key) => {
        const ctx: Record<string, Record<string, unknown>> = {
          ticket: ticketContext,
          customer: customerContext,
          agent: agentContext,
        };
        return String(ctx[ns]?.[key] ?? "");
      });

    onReplyTextChange(resolve(template.body));
    if (onReplySubjectChange) onReplySubjectChange(resolve(template.subject));

    // Track use count
    try { await emailTemplateApi.use(template._id, { ticket: ticketContext, customer: customerContext, agent: agentContext }); }
    catch { /* non-critical */ }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1 text-xs"
        onClick={() => setManagerOpen(true)}
      >
        <LayoutTemplate className="h-3.5 w-3.5" />
        Use Template
        <ChevronDown className="h-3 w-3" />
      </Button>

      <TemplateManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        onSelect={handleSelectTemplate}
      />
    </>
  );
}

export { TemplateManager, TemplateFormModal };
