import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Plus, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { emailTemplateApi, type EmailTemplate } from "../api/emailTemplateApi";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const CATEGORIES = ["reply", "resolution", "escalation", "follow-up", "custom"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  reply: "bg-blue-100 text-blue-700",
  resolution: "bg-green-100 text-green-700",
  escalation: "bg-red-100 text-red-700",
  "follow-up": "bg-orange-100 text-orange-700",
  custom: "bg-gray-100 text-gray-700",
};

interface FormData {
  name: string;
  subject: string;
  body: string;
  description: string;
  category: EmailTemplate["category"];
  is_active: boolean;
}

const EMPTY_FORM: FormData = {
  name: "",
  subject: "",
  body: "",
  description: "",
  category: "reply",
  is_active: true,
};

function toFormData(t: EmailTemplate): FormData {
  return {
    name: t.name,
    subject: t.subject,
    body: t.body,
    description: t.description ?? "",
    category: t.category,
    is_active: t.is_active,
  };
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

function TemplateModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: EmailTemplate | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormData>(editing ? toFormData(editing) : EMPTY_FORM);

  const set = (k: keyof FormData, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const createMut = useMutation({
    mutationFn: (data: Partial<EmailTemplate>) => emailTemplateApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-templates"] }); onClose(); },
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<EmailTemplate>) =>
      emailTemplateApi.update(editing!._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-templates"] }); onClose(); },
  });

  const saving = createMut.isPending || updateMut.isPending;

  const handleSave = () => {
    const payload: Partial<EmailTemplate> = {
      name: form.name.trim(),
      subject: form.subject.trim(),
      body: form.body,
      description: form.description.trim() || undefined,
      category: form.category,
      is_active: form.is_active,
    };
    if (editing) updateMut.mutate(payload);
    else createMut.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Template" : "New Email Template"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Template name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Subject</label>
            <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Email subject (supports {{placeholders}})" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional short description" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Body</label>
            <Textarea
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              rows={8}
              placeholder="Email body (supports {{ticket.number}}, {{customer.name}}, {{agent.name}}, etc.)"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
            />
            Active
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.subject.trim() || !form.body.trim()}
          >
            {saving ? "Saving..." : editing ? "Save Changes" : "Create Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function EmailTemplatesPage() {
  const qc = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["email-templates", categoryFilter],
    queryFn: () =>
      emailTemplateApi.list(categoryFilter === "all" ? undefined : categoryFilter),
  });

  const templates = data?.data ?? [];

  const deleteMut = useMutation({
    mutationFn: (id: string) => emailTemplateApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (t: EmailTemplate) => { setEditing(t); setModalOpen(true); };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Mail className="h-6 w-6" /> Email Templates
          </h1>
          <p className="text-sm text-muted-foreground">
            Reusable reply templates agents can insert into ticket responses.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> New Template
        </Button>
      </div>

      <div className="w-56">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading templates...</p>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No templates yet. Create one to speed up agent replies.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t._id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">{t.name}</CardTitle>
                  <p className="truncate text-xs text-muted-foreground">{t.subject}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete template "${t.name}"?`)) deleteMut.mutate(t._id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="line-clamp-3 text-sm text-muted-foreground">{t.body}</p>
                <div className="flex items-center justify-between pt-1">
                  <Badge className={CATEGORY_COLORS[t.category] ?? ""}>{t.category}</Badge>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {!t.is_active && (
                      <Badge variant="outline" className="gap-1">
                        <X className="h-3 w-3" /> Inactive
                      </Badge>
                    )}
                    <span>Used {t.use_count}x</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <TemplateModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
      )}
    </div>
  );
}
