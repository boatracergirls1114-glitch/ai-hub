import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me-strong-password";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json({ limit: "5mb" }));

function slugify(title) {
  return String(title || "article").trim().toLowerCase()
    .replace(/[^\w\u3040-\u30ff\u3400-\u9fff-]+/g, "-")
    .replace(/^-+|-+$/g, "") || `article-${Date.now()}`;
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "ログインしてください" });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "ログイン期限が切れています" }); }
}

const articleSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional().default(""),
  body: z.string().optional().default(""),
  category: z.string().optional().default("未分類"),
  tags: z.array(z.string()).optional().default([])
});

app.get("/api/health", (req, res) => res.json({ ok: true, version: "v1.0.0-beta" }));

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "ユーザー名またはパスワードが違います" });
  }
  const token = jwt.sign({ username, role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, username });
});

app.get("/api/articles", async (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  const category = String(req.query.category || "").trim();
  const tag = String(req.query.tag || "").trim();
  const where = { status: "published" };
  if (category) where.category = category;
  if (tag) where.tags = { has: tag };

  const articles = await prisma.article.findMany({ where, orderBy: { updatedAt: "desc" } });
  const filtered = q ? articles.filter(a => {
    const text = [a.title, a.summary, a.body, a.category, ...(a.tags || [])].join(" ").toLowerCase();
    return q.split(/\s+/).every(w => text.includes(w));
  }) : articles;
  res.json({ articles: filtered });
});

app.get("/api/articles/:id", async (req, res) => {
  const article = await prisma.article.findFirst({
    where: { OR: [{ id: req.params.id }, { slug: req.params.id }], status: "published" }
  });
  if (!article) return res.status(404).json({ error: "記事が見つかりません" });
  res.json(article);
});

app.post("/api/articles", auth, async (req, res) => {
  const parsed = articleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "入力内容を確認してください" });
  const data = parsed.data;
  let slug = slugify(data.title);
  const baseSlug = slug;
  let n = 2;
  while (await prisma.article.findUnique({ where: { slug } })) slug = `${baseSlug}-${n++}`;
  const article = await prisma.article.create({
    data: { ...data, slug, tags: data.tags.map(t => t.trim()).filter(Boolean) }
  });
  res.json(article);
});

app.put("/api/articles/:id", auth, async (req, res) => {
  const parsed = articleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "入力内容を確認してください" });
  const existing = await prisma.article.findFirst({ where: { OR: [{ id: req.params.id }, { slug: req.params.id }] } });
  if (!existing) return res.status(404).json({ error: "記事が見つかりません" });
  const data = parsed.data;
  const article = await prisma.article.update({
    where: { id: existing.id },
    data: { ...data, tags: data.tags.map(t => t.trim()).filter(Boolean) }
  });
  res.json(article);
});

app.delete("/api/articles/:id", auth, async (req, res) => {
  const existing = await prisma.article.findFirst({ where: { OR: [{ id: req.params.id }, { slug: req.params.id }] } });
  if (!existing) return res.status(404).json({ error: "記事が見つかりません" });
  await prisma.article.update({ where: { id: existing.id }, data: { status: "deleted" } });
  res.json({ ok: true });
});

app.get("/api/meta", async (req, res) => {
  const articles = await prisma.article.findMany({ where: { status: "published" } });
  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))].sort();
  const tags = [...new Set(articles.flatMap(a => a.tags || []))].sort();
  res.json({ articles: articles.length, categories, tags, version: "v1.0.0-beta" });
});

app.listen(PORT, () => console.log(`AI Hub backend running on port ${PORT}`));
