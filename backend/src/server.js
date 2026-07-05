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

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "ログインしてください" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "ログイン期限が切れています" });
  }
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "AI Hub", version: "v1.0.0-alpha" });
});

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

  const articles = await prisma.article.findMany({
    where: { status: "published" },
    orderBy: { updatedAt: "desc" }
  });

  const filtered = q
    ? articles.filter((a) => {
        const text = [a.title, a.summary, a.body, a.category, ...(a.tags || [])].join(" ").toLowerCase();
        return q.split(/\s+/).every((w) => text.includes(w));
      })
    : articles;

  res.json({ articles: filtered });
});

app.get("/api/meta", async (req, res) => {
  const articles = await prisma.article.findMany({ where: { status: "published" } });
  const categories = [...new Set(articles.map((a) => a.category))];
  const tags = [...new Set(articles.flatMap((a) => a.tags || []))];

  res.json({
    articles: articles.length,
    categories: categories.length,
    tags: tags.length,
    version: "v1.0.0-alpha"
  });
});

app.listen(PORT, () => {
  console.log(`AI Hub backend running on port ${PORT}`);
});
