import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Brain, Database, FileText, Lock, LogOut, Plus, Search, Tags, Trash2, Pencil, X, Save } from "lucide-react";
import "./styles.css";

const API = "/api";

function md(text = "") {
  const escaped = String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const lines = escaped.split("\n");
  const html = [];
  let list = false;
  for (const line of lines) {
    if (line.startsWith("- ")) {
      if (!list) { html.push("<ul>"); list = true; }
      html.push(`<li>${line.slice(2)}</li>`);
      continue;
    }
    if (list) { html.push("</ul>"); list = false; }
    if (line.startsWith("## ")) html.push(`<h2>${line.slice(3)}</h2>`);
    else if (line.startsWith("### ")) html.push(`<h3>${line.slice(4)}</h3>`);
    else if (!line.trim()) html.push("<br />");
    else html.push(`<p>${line}</p>`);
  }
  if (list) html.push("</ul>");
  return html.join("");
}

function emptyForm() {
  return { id: "", title: "", category: "AI Hub", tags: "", summary: "", body: "" };
}

function App() {
  const [articles, setArticles] = useState([]);
  const [meta, setMeta] = useState({ articles: 0, categories: [], tags: [], version: "v1.0.0-beta" });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [token, setToken] = useState(localStorage.getItem("aihub_token") || "");
  const [login, setLogin] = useState({ username: "admin", password: "" });
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [message, setMessage] = useState("");

  async function fetchJson(path, options = {}) {
    const res = await fetch(`${API}${path}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "エラーが発生しました");
    return data;
  }

  async function load() {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    const [a, m] = await Promise.all([fetchJson(`/articles?${params}`), fetchJson("/meta")]);
    setArticles(a.articles || []);
    setMeta(m);
  }

  useEffect(() => { load(); }, [category, tag]);

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
    } catch (e) { setMessage(e.message); }
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
      await load();
    } catch (e) { setMessage(e.message); }
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
      await load();
    } catch (e) { setMessage(e.message); }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo"><div className="logoMark"><Brain size={26} /></div><div><strong>AI Hub</strong><span>Personal Knowledge OS</span></div></div>
        <nav>
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>ホーム</button>
          <button className={view === "knowledge" ? "active" : ""} onClick={() => setView("knowledge")}>ナレッジ</button>
          <button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>管理</button>
        </nav>
        <div className="version"><strong>{meta.version}</strong><p>実用化ベータ版</p></div>
      </aside>

      <main className="main">
        <header className="hero">
          <div><p className="eyebrow">AI Hub {meta.version}</p><h1>知識を貯める。つなげる。育てる。</h1><p className="lead">作業ログ、ナレッジ、AI活用を統合するあなた専用の知識OSです。</p></div>
          <div className="heroActions">{token ? <button className="ghost" onClick={logout}><LogOut size={16} />ログアウト</button> : null}<button onClick={newArticle}><Plus size={16} />新規ナレッジ</button></div>
        </header>

        <section className="searchPanel">
          <Search size={20} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="検索：Docker、Proxmox、AI Hub..." />
          <button onClick={load}>検索</button>
        </section>

        {message && <div className="message">{message}</div>}

        {view === "dashboard" && <>
          <section className="stats">
            <div className="stat"><FileText /><span>記事数</span><strong>{meta.articles}</strong></div>
            <div className="stat"><Database /><span>カテゴリ</span><strong>{meta.categories?.length || 0}</strong></div>
            <div className="stat"><Tags /><span>タグ</span><strong>{meta.tags?.length || 0}</strong></div>
          </section>
          <PanelTitle title="最近のナレッジ" sub={`${articles.length}件`} />
          <ArticleGrid articles={articles.slice(0, 6)} token={token} onOpen={setSelected} onEdit={editArticle} onDelete={deleteArticle} />
        </>}

        {view === "knowledge" && <>
          <section className="filters">
            <select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">すべてのカテゴリ</option>{(meta.categories || []).map(c => <option key={c}>{c}</option>)}</select>
            <select value={tag} onChange={(e) => setTag(e.target.value)}><option value="">すべてのタグ</option>{(meta.tags || []).map(t => <option key={t}>{t}</option>)}</select>
            <button className="ghost" onClick={() => { setCategory(""); setTag(""); setQuery(""); load(); }}>クリア</button>
          </section>
          <ArticleGrid articles={articles} token={token} onOpen={setSelected} onEdit={editArticle} onDelete={deleteArticle} />
        </>}

        {view === "admin" && <section className="panel">
          {!token ? <form onSubmit={doLogin} className="form small"><h2><Lock size={20} />管理ログイン</h2><label>ユーザー名<input value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} /></label><label>パスワード<input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></label><button>ログイン</button></form> : <div><h2>管理画面</h2><p className="muted">ログイン済みです。新規作成、編集、削除ができます。</p><button onClick={newArticle}><Plus size={16} />新規作成</button></div>}
        </section>}

        {view === "editor" && <section className="panel">
          {!token ? <p>編集するには管理画面からログインしてください。</p> :
            <form onSubmit={saveArticle} className="form">
              <h2>{form.id ? "ナレッジ編集" : "新規ナレッジ"}</h2>
              <label>タイトル<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
              <label>カテゴリ<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
              <label>タグ（カンマ区切り）<input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></label>
              <label>概要<textarea rows="3" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></label>
              <label>本文（Markdown風）<textarea rows="18" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
              <div className="row"><button><Save size={16} />保存して公開</button><button type="button" className="ghost" onClick={() => setView("knowledge")}>戻る</button></div>
            </form>}
        </section>}
      </main>

      {selected && <div className="modal"><div className="modalCard"><button className="close" onClick={() => setSelected(null)}><X /></button><p className="eyebrow">{selected.category}</p><h2>{selected.title}</h2><p className="muted">{selected.summary}</p><TagList tags={selected.tags} /><div className="markdown" dangerouslySetInnerHTML={{ __html: md(selected.body) }} /></div></div>}
    </div>
  );
}

function PanelTitle({ title, sub }) { return <div className="panelTitle"><h2>{title}</h2><span>{sub}</span></div>; }
function TagList({ tags = [] }) { return <div className="tags">{tags.map(t => <b key={t}>{t}</b>)}</div>; }
function ArticleGrid({ articles, token, onOpen, onEdit, onDelete }) {
  if (!articles.length) return <div className="empty">記事がありません。</div>;
  return <section className="cards">{articles.map(a => <article className="card" key={a.id}><div className="cardTop"><span>{a.category}</span><small>{new Date(a.updatedAt).toLocaleDateString("ja-JP")}</small></div><h3 onClick={() => onOpen(a)}>{a.title}</h3><p>{a.summary}</p><TagList tags={a.tags} /><div className="cardActions"><button className="ghost" onClick={() => onOpen(a)}>読む</button>{token && <button className="ghost" onClick={() => onEdit(a)}><Pencil size={15} />編集</button>}{token && <button className="danger" onClick={() => onDelete(a)}><Trash2 size={15} />削除</button>}</div></article>)}</section>;
}

createRoot(document.getElementById("root")).render(<App />);
