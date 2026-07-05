import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Brain,
  Database,
  Download,
  FileText,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Save,
  Search,
  Sparkles,
  Tags,
  Trash2,
  X
} from "lucide-react";
import "./styles.css";

const API = "/api";

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function md(text = "") {
  const escaped = escapeHtml(text);
  const lines = escaped.split("\n");
  const html = [];
  let list = false;
  let code = false;
  let codeLang = "text";
  let codeLines = [];

  function flushList() {
    if (list) {
      html.push("</ul>");
      list = false;
    }
  }

  function flushCode() {
    const raw = codeLines.join("\n");
    const id = `code-${Math.random().toString(36).slice(2)}`;
    html.push(`
      <div class="codeBlock">
        <div class="codeHead">
          <span>${codeLang || "text"}</span>
          <button class="copyBtn" data-copy-id="${id}">Copy</button>
        </div>
        <pre id="${id}"><code>${raw}</code></pre>
      </div>
    `);
    code = false;
    codeLines = [];
    codeLang = "text";
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (code) flushCode();
      else {
        flushList();
        code = true;
        codeLang = line.replace("```", "").trim() || "text";
      }
      continue;
    }

    if (code) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!list) {
        html.push("<ul>");
        list = true;
      }
      html.push(`<li>${line.slice(2)}</li>`);
      continue;
    }

    flushList();

    if (line.startsWith("# ")) html.push(`<h1>${line.slice(2)}</h1>`);
    else if (line.startsWith("## ")) html.push(`<h2>${line.slice(3)}</h2>`);
    else if (line.startsWith("### ")) html.push(`<h3>${line.slice(4)}</h3>`);
    else if (line.startsWith("> ")) html.push(`<blockquote>${line.slice(2)}</blockquote>`);
    else if (!line.trim()) html.push("<br />");
    else html.push(`<p>${line}</p>`);
  }

  flushList();
  if (code) flushCode();
  return html.join("");
}

function emptyForm() {
  return { id: "", title: "", category: "AI Hub", tags: "", summary: "", body: "" };
}

function App() {
  const [articles, setArticles] = useState([]);
  const [meta, setMeta] = useState({ articles: 0, categories: [], tags: [], version: "v1.1.1" });
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("aihub_token") || "");
  const [login, setLogin] = useState({ username: "admin", password: "" });
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [rawText, setRawText] = useState("");
  const [message, setMessage] = useState("");

  async function fetchJson(path, options = {}) {
    const res = await fetch(`${API}${path}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "エラーが発生しました");
    return data;
  }

  async function load(nextQuery = activeQuery) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (nextQuery) params.set("q", nextQuery);
      if (category) params.set("category", category);
      if (tag) params.set("tag", tag);

      const [a, m] = await Promise.all([
        fetchJson(`/articles?${params}`),
        fetchJson("/meta")
      ]);

      setArticles(a.articles || []);
      setMeta(m);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(activeQuery); }, [category, tag]);

  useEffect(() => {
    setTimeout(() => {
      document.querySelectorAll(".copyBtn").forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute("data-copy-id");
          const el = document.getElementById(id);
          if (el) navigator.clipboard?.writeText(el.innerText);
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = "Copy"), 900);
        };
      });
    }, 50);
  }, [selected, form.body, view]);

  function runSearch() {
    const q = query.trim();
    setActiveQuery(q);
    setView("knowledge");
    load(q);
  }

  function clearSearch() {
    setQuery("");
    setActiveQuery("");
    setCategory("");
    setTag("");
    setView("knowledge");
    setTimeout(() => load(""), 0);
  }

  async function doLogin(e) {
    e.preventDefault();
    setMessage("");
    try {
      const data = await fetchJson("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login)
      });
      localStorage.setItem("aihub_token", data.token);
      setToken(data.token);
      setMessage("ログインしました。");
    } catch (e) {
      setMessage(e.message);
    }
  }

  function logout() {
    localStorage.removeItem("aihub_token");
    setToken("");
    setMessage("ログアウトしました。");
  }

  function newArticle() {
    setForm(emptyForm());
    setView("editor");
  }

  function editArticle(article) {
    setForm({
      id: article.id,
      title: article.title,
      category: article.category,
      tags: (article.tags || []).join(", "),
      summary: article.summary || "",
      body: article.body || ""
    });
    setView("editor");
  }

  async function saveArticle(e) {
    e.preventDefault();
    setMessage("");

    const payload = {
      title: form.title,
      category: form.category,
      summary: form.summary,
      body: form.body,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean)
    };

    try {
      await fetchJson(form.id ? `/articles/${form.id}` : "/articles", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      setMessage("保存しました。");
      setView("knowledge");
      await load(activeQuery);
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function deleteArticle(article) {
    if (!confirm(`「${article.title}」を削除しますか？`)) return;
    setMessage("");

    try {
      await fetchJson(`/articles/${article.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("削除しました。");
      await load(activeQuery);
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function structureText() {
    setMessage("");
    try {
      const data = await fetchJson("/knowledge/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: rawText })
      });

      setForm({
        id: "",
        title: data.title,
        category: data.category,
        tags: (data.tags || []).join(", "),
        summary: data.summary,
        body: data.body
      });

      setView("editor");
      setMessage("ナレッジ化しました。内容を確認して保存できます。");
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function saveRawText() {
    setMessage("");
    try {
      await fetchJson("/knowledge/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: rawText })
      });

      setRawText("");
      setMessage("AI Hubに保存しました。");
      setView("knowledge");
      await load(activeQuery);
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function exportData() {
    try {
      const data = await fetchJson("/export", { headers: { Authorization: `Bearer ${token}` } });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-hub-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setMessage(e.message);
    }
  }

  const resultLabel = activeQuery || category || tag ? `検索結果：${articles.length}件` : `全ナレッジ：${articles.length}件`;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logoMark"><Brain size={26} /></div>
          <div><strong>AI Hub</strong><span>Personal Knowledge OS</span></div>
        </div>

        <nav>
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>ホーム</button>
          <button className={view === "knowledge" ? "active" : ""} onClick={() => setView("knowledge")}>ナレッジ</button>
          <button className={view === "capture" ? "active" : ""} onClick={() => setView("capture")}>AI Hubに保存</button>
          <button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>管理</button>
        </nav>

        <div className="version"><strong>{meta.version}</strong><p>Hotfix</p></div>
      </aside>

      <main className="main">
        <header className="hero">
          <div>
            <p className="eyebrow">AI Hub {meta.version}</p>
            <h1>知識を貯める。つなげる。育てる。</h1>
            <p className="lead">作業ログ、ChatGPT会話、ナレッジを保存して再利用するための知識OSです。</p>
          </div>
          <div className="heroActions">
            {token ? <button className="ghost" onClick={logout}><LogOut size={16} />ログアウト</button> : null}
            <button onClick={newArticle}><Plus size={16} />新規ナレッジ</button>
          </div>
        </header>

        <section className="searchPanel">
          <Search size={20} />
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") runSearch(); }} placeholder="検索：Docker、Proxmox、AI Hub..." />
          <button onClick={runSearch}>検索</button>
          <button className="ghost" onClick={clearSearch}>クリア</button>
        </section>

        {(activeQuery || category || tag) && (
          <div className="searchInfo">
            <span>{resultLabel}</span>
            {activeQuery && <b>キーワード: {activeQuery}</b>}
            {category && <b>カテゴリ: {category}</b>}
            {tag && <b>タグ: {tag}</b>}
          </div>
        )}

        {message && <div className="message">{message}</div>}

        {view === "dashboard" && (
          <>
            <section className="stats">
              <div className="stat"><FileText /><span>記事数</span><strong>{meta.articles}</strong></div>
              <div className="stat"><Database /><span>カテゴリ</span><strong>{meta.categories?.length || 0}</strong></div>
              <div className="stat"><Tags /><span>タグ</span><strong>{meta.tags?.length || 0}</strong></div>
            </section>

            <div className="quick">
              <button onClick={() => setView("capture")}><Sparkles size={16} />会話・ログをAI Hubに保存</button>
              {token && <button className="ghost" onClick={exportData}><Download size={16} />エクスポート</button>}
            </div>

            <PanelTitle title="最近のナレッジ" sub={`${articles.length}件`} />
            <ArticleGrid articles={articles.slice(0, 6)} token={token} onOpen={setSelected} onEdit={editArticle} onDelete={deleteArticle} />
          </>
        )}

        {view === "knowledge" && (
          <>
            <section className="filters">
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">すべてのカテゴリ</option>
                {(meta.categories || []).map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={tag} onChange={e => setTag(e.target.value)}>
                <option value="">すべてのタグ</option>
                {(meta.tags || []).map(t => <option key={t}>{t}</option>)}
              </select>
              <button className="ghost" onClick={clearSearch}>条件クリア</button>
            </section>

            <PanelTitle title={activeQuery || category || tag ? "検索結果" : "ナレッジ一覧"} sub={loading ? "読み込み中..." : `${articles.length}件`} />
            <ArticleGrid articles={articles} token={token} onOpen={setSelected} onEdit={editArticle} onDelete={deleteArticle} />
          </>
        )}

        {view === "capture" && (
          <section className="panel">
            <h2><Sparkles size={20} />AI Hubに保存</h2>
            {!token ? (
              <p>保存するには管理画面からログインしてください。</p>
            ) : (
              <>
                <p className="muted">ChatGPTの会話、作業ログ、エラー内容などを貼り付けてください。タイトル・概要・タグ・本文に整えて保存できます。</p>
                <textarea className="captureBox" value={rawText} onChange={e => setRawText(e.target.value)} placeholder="ここに会話や作業ログを貼り付け..." />
                <div className="row">
                  <button onClick={structureText}><Sparkles size={16} />整形して確認</button>
                  <button className="ghost" onClick={saveRawText}><Save size={16} />そのまま保存</button>
                </div>
              </>
            )}
          </section>
        )}

        {view === "admin" && (
          <section className="panel">
            {!token ? (
              <form onSubmit={doLogin} className="form small">
                <h2><Lock size={20} />管理ログイン</h2>
                <label>ユーザー名<input value={login.username} onChange={e => setLogin({ ...login, username: e.target.value })} /></label>
                <label>パスワード<input type="password" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} /></label>
                <button>ログイン</button>
              </form>
            ) : (
              <div>
                <h2>管理画面</h2>
                <p className="muted">ログイン済みです。新規作成、編集、削除、エクスポートができます。</p>
                <div className="row">
                  <button onClick={newArticle}><Plus size={16} />新規作成</button>
                  <button className="ghost" onClick={exportData}><Download size={16} />エクスポート</button>
                </div>
              </div>
            )}
          </section>
        )}

        {view === "editor" && (
          <section className="panel">
            {!token ? (
              <p>編集するには管理画面からログインしてください。</p>
            ) : (
              <form onSubmit={saveArticle} className="form">
                <h2>{form.id ? "ナレッジ編集" : "新規ナレッジ"}</h2>
                <label>タイトル<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
                <label>カテゴリ<input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label>
                <label>タグ（カンマ区切り）<input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></label>
                <label>概要<textarea rows="3" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></label>
                <label>本文（Markdown風）<textarea rows="18" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /></label>
                <div className="previewBox">
                  <h3>プレビュー</h3>
                  <div className="markdown" dangerouslySetInnerHTML={{ __html: md(form.body) }} />
                </div>
                <div className="row">
                  <button><Save size={16} />保存して公開</button>
                  <button type="button" className="ghost" onClick={() => setView("knowledge")}>戻る</button>
                </div>
              </form>
            )}
          </section>
        )}
      </main>

      {selected && (
        <div className="modal">
          <div className="modalCard">
            <button className="close" onClick={() => setSelected(null)}><X /></button>
            <p className="eyebrow">{selected.category}</p>
            <h2>{selected.title}</h2>
            <p className="muted">{selected.summary}</p>
            <TagList tags={selected.tags} />
            <div className="markdown" dangerouslySetInnerHTML={{ __html: md(selected.body) }} />
          </div>
        </div>
      )}
    </div>
  );
}

function PanelTitle({ title, sub }) {
  return <div className="panelTitle"><h2>{title}</h2><span>{sub}</span></div>;
}

function TagList({ tags = [] }) {
  return <div className="tags">{tags.map(t => <b key={t}>{t}</b>)}</div>;
}

function ArticleGrid({ articles, token, onOpen, onEdit, onDelete }) {
  if (!articles.length) {
    return (
      <div className="empty">
        <strong>該当するナレッジがありません。</strong>
        <p>別のキーワードで検索するか、条件をクリアしてください。</p>
      </div>
    );
  }

  return (
    <section className="cards">
      {articles.map(a => (
        <article className="card" key={a.id}>
          <div className="cardTop">
            <span>{a.category}</span>
            <small>{new Date(a.updatedAt).toLocaleDateString("ja-JP")}</small>
          </div>
          <h3 onClick={() => onOpen(a)}>{a.title}</h3>
          <p>{a.summary}</p>
          <TagList tags={a.tags} />
          <div className="cardActions">
            <button className="ghost" onClick={() => onOpen(a)}>読む</button>
            {token && <button className="ghost" onClick={() => onEdit(a)}><Pencil size={15} />編集</button>}
            {token && <button className="danger" onClick={() => onDelete(a)}><Trash2 size={15} />削除</button>}
          </div>
        </article>
      ))}
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
