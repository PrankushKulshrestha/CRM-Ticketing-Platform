import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Plus, BookOpen, ThumbsUp, ThumbsDown, Eye,
  Tag, ChevronRight, X, Pencil, Trash2, CheckCircle, HelpCircle,
  Wrench, FileText, BookMarked,
} from "lucide-react";
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
import { knowledgeBaseApi, type KBArticle } from "../api/knowledgeBaseApi";

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const ARTICLE_TYPES = [
  { value: "faq", label: "FAQ", icon: HelpCircle, color: "bg-blue-100 text-blue-700" },
  { value: "how-to", label: "How-To", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  { value: "troubleshooting", label: "Troubleshooting", icon: Wrench, color: "bg-orange-100 text-orange-700" },
  { value: "policy", label: "Policy", icon: FileText, color: "bg-purple-100 text-purple-700" },
  { value: "other", label: "Other", icon: BookMarked, color: "bg-gray-100 text-gray-700" },
] as const;

const TYPE_COLORS: Record<string, string> = {
  faq: "bg-blue-100 text-blue-700",
  "how-to": "bg-green-100 text-green-700",
  troubleshooting: "bg-orange-100 text-orange-700",
  policy: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-700",
};

/* -------------------------------------------------------------------------- */
/* Article Form                                                                */
/* -------------------------------------------------------------------------- */

interface ArticleFormData {
  title: string;
  keywords: string;
  category: string;
  sub_category: string;
  solution: string;
  summary: string;
  article_type: KBArticle["article_type"];
  tags: string;
  is_published: boolean;
}

const EMPTY_FORM: ArticleFormData = {
  title: "",
  keywords: "",
  category: "",
  sub_category: "",
  solution: "",
  summary: "",
  article_type: "faq",
  tags: "",
  is_published: true,
};

function toFormData(a: KBArticle): ArticleFormData {
  return {
    title: a.title,
    keywords: a.keywords.join(", "),
    category: a.category,
    sub_category: a.sub_category ?? "",
    solution: a.solution,
    summary: a.summary ?? "",
    article_type: a.article_type,
    tags: a.tags.join(", "),
    is_published: a.is_published,
  };
}

function fromFormData(f: ArticleFormData): Partial<KBArticle> {
  return {
    title: f.title.trim(),
    keywords: f.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    category: f.category.trim(),
    sub_category: f.sub_category.trim() || undefined,
    solution: f.solution.trim(),
    summary: f.summary.trim() || undefined,
    article_type: f.article_type,
    tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
    is_published: f.is_published,
  };
}

/* -------------------------------------------------------------------------- */
/* Article Modal                                                               */
/* -------------------------------------------------------------------------- */

interface ArticleModalProps {
  open: boolean;
  onClose: () => void;
  editing?: KBArticle | null;
  categories: string[];
}

function ArticleModal({ open, onClose, editing, categories }: ArticleModalProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ArticleFormData>(editing ? toFormData(editing) : EMPTY_FORM);

  const set = (k: keyof ArticleFormData, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const createMut = useMutation({
    mutationFn: (data: Partial<KBArticle>) => knowledgeBaseApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["kb"] }); onClose(); },
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<KBArticle>) => knowledgeBaseApi.update(editing!._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["kb"] }); onClose(); },
  });

  const handleSubmit = () => {
    const data = fromFormData(form);
    editing ? updateMut.mutate(data) : createMut.mutate(data);
  };

  const isLoading = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Article" : "New Knowledge Base Article"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Title *</label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Article title" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Category *</label>
              <Input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Billing, Technical"
                list="categories-list"
              />
              <datalist id="categories-list">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Sub-Category</label>
              <Input value={form.sub_category} onChange={(e) => set("sub_category", e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Article Type</label>
              <Select value={form.article_type} onValueChange={(v) => set("article_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ARTICLE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={form.is_published ? "published" : "draft"} onValueChange={(v) => set("is_published", v === "published")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Keywords (comma-separated)</label>
            <Input
              value={form.keywords}
              onChange={(e) => set("keywords", e.target.value)}
              placeholder="e.g. password, reset, login, auth"
            />
            <p className="text-xs text-muted-foreground mt-1">Agents search by these keywords — be specific</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Short Summary</label>
            <Input value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="One-line description shown in search results" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Solution / Content *</label>
            <Textarea
              value={form.solution}
              onChange={(e) => set("solution", e.target.value)}
              placeholder="Full solution description, steps, or explanation..."
              rows={8}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Tags (comma-separated)</label>
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="e.g. urgent, billing, account" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isLoading || !form.title || !form.category || !form.solution}>
              {isLoading ? "Saving…" : editing ? "Update Article" : "Create Article"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Article Detail Drawer                                                       */
/* -------------------------------------------------------------------------- */

interface ArticleDetailProps {
  article: KBArticle;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ArticleDetail({ article, onClose, onEdit, onDelete }: ArticleDetailProps) {
  const qc = useQueryClient();

  const voteMut = useMutation({
    mutationFn: (vote: "helpful" | "not_helpful") => knowledgeBaseApi.vote(article._id, vote),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background border-l shadow-xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Badge className={TYPE_COLORS[article.article_type] ?? ""}>{article.article_type}</Badge>
          <Badge variant="outline">{article.category}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <h1 className="text-xl font-semibold">{article.title}</h1>
        {article.summary && <p className="text-muted-foreground text-sm">{article.summary}</p>}

        <div className="flex flex-wrap gap-1">
          {article.keywords.map((k) => (
            <span key={k} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
              <Tag className="h-2.5 w-2.5" />{k}
            </span>
          ))}
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-4 bg-muted/30 whitespace-pre-wrap text-sm">
          {article.solution}
        </div>

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
          </div>
        )}
      </div>

      <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{article.view_count} views</span>
        <div className="flex gap-3">
          <button
            className="flex items-center gap-1 hover:text-green-600 transition-colors"
            onClick={() => voteMut.mutate("helpful")}
          >
            <ThumbsUp className="h-4 w-4" />{article.helpful_count}
          </button>
          <button
            className="flex items-center gap-1 hover:text-red-500 transition-colors"
            onClick={() => voteMut.mutate("not_helpful")}
          >
            <ThumbsDown className="h-4 w-4" />{article.not_helpful_count}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page                                                                   */
/* -------------------------------------------------------------------------- */

export default function KnowledgeBasePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KBArticle | null>(null);
  const [selected, setSelected] = useState<KBArticle | null>(null);

  const { data: categoriesData } = useQuery({
    queryKey: ["kb", "categories"],
    queryFn: () => knowledgeBaseApi.getCategories(),
  });

  const { data: statsData } = useQuery({
    queryKey: ["kb", "stats"],
    queryFn: () => knowledgeBaseApi.getStats(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["kb", "search", search, categoryFilter, typeFilter],
    queryFn: () =>
      knowledgeBaseApi.search({
        query: search || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        article_type: typeFilter !== "all" ? typeFilter : undefined,
        limit: 50,
      }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => knowledgeBaseApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kb"] });
      setSelected(null);
    },
  });

  const categories = categoriesData?.data ?? [];
  const stats = statsData?.data;
  const articles = data?.data?.articles ?? [];

  const openCreate = useCallback(() => { setEditing(null); setModalOpen(true); }, []);
  const openEdit = useCallback((a: KBArticle) => { setEditing(a); setModalOpen(true); setSelected(null); }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Centralized repository for solutions, FAQs, and troubleshooting guides
          </p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />New Article</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Total Articles</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            </CardContent>
          </Card>
          {stats.byType.slice(0, 2).map((t) => (
            <Card key={t._id}>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground capitalize">{t._id}</p>
                <p className="text-2xl font-bold">{t.count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-50 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by keyword, title, or topic…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ARTICLE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No articles found</p>
          <p className="text-sm mt-1">
            {search ? `No results for "${search}"` : "Start building your knowledge base"}
          </p>
          <Button className="mt-4" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Create First Article</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {articles.map((article) => (
            <Card
              key={article._id}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => setSelected(article)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge className={`text-xs shrink-0 ${TYPE_COLORS[article.article_type] ?? ""}`}>
                    {article.article_type}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </div>
                <CardTitle className="text-sm leading-snug mt-1">{article.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {article.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{article.summary}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">{article.category}</Badge>
                  {article.keywords.slice(0, 3).map((k) => (
                    <span key={k} className="text-xs bg-muted px-1.5 py-0.5 rounded">{k}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.view_count}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{article.helpful_count}</span>
                  {!article.is_published && <Badge variant="secondary" className="text-xs">Draft</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Article Detail Panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
          <ArticleDetail
            article={selected}
            onClose={() => setSelected(null)}
            onEdit={() => openEdit(selected)}
            onDelete={() => {
              if (confirm("Delete this article?")) deleteMut.mutate(selected._id);
            }}
          />
        </>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <ArticleModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          editing={editing}
          categories={categories}
        />
      )}
    </div>
  );
}
