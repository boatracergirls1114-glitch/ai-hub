import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Brain, Database, FileText, Lock, Search, Sparkles, Tags } from "lucide-react";
import "./styles.css";

function App() {
  const [articles, setArticles] = useState([]);
  const [meta, setMeta] = useState({ articles: 0, categories: 0, tags: 0, version: "v1.0.0-alpha" });
  const [query, setQuery] = useState("");
  const [token, setToken] = useState(localStorage.getItem("aihub_token") || "");
  const [login, setLogin] = useState({ username: "admin", password: "" });
  const [message, setMessage] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const [a, m] = await Promise.all([
      fetch(`/api/articles?${params}`).then((r) => r.json()),
      fetch("/api/meta").then((r) => r.json())
    ]);
    setArticles(a.articles || []);
    setMeta(m);
  }

  useEffect(() => {
    load();
  }, []);

  async function doLogin(e) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(login)
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "ログイン失敗");
      return;
    }
    localStorage.setItem("aihub_token", data.token);
    setToken(data.token);
    setMessage("ログインしました。");
  }

  function logout() {
    localStorage.removeItem("aihub_token");
    setToken("");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logoMark"><Brain size={26} /></div>
          <div>
            <strong>AI Hub</strong>
            <span>Personal Knowledge OS</span>
          </div>
        </div>

        <nav>
          <a className="active">Dashboard</a>
          <a>Knowledge</a>
          <a>Admin</a>
        </nav>

        <div className="version">
          <Sparkles size={18} />
          <div>
            <strong>{meta.version}</strong>
            <p>alpha build</p>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="hero">
          <p className="eyebrow">AI Hub v1.0.0-alpha</p>
          <h1>知識を貯める。つなげる。育てる。</h1>
          <p className="lead">AI Hubは、作業ログ・ナレッジ・AI活用を統合するPersonal Knowledge OSです。</p>
        </header>

        <section className="searchPanel">
          <Search size={20} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="検索：Docker、Proxmox、AI Hub..." />
          <button onClick={load}>検索</button>
        </section>

        {message && <div className="message">{message}</div>}

        <section className="stats">
          <div className="stat"><FileText /><span>Articles</span><strong>{meta.articles}</strong></div>
          <div className="stat"><Database /><span>Categories</span><strong>{meta.categories}</strong></div>
          <div className="stat"><Tags /><span>Tags</span><strong>{meta.tags}</strong></div>
        </section>

        <section className="contentGrid">
          <div className="panel wide">
            <div className="panelHead">
              <h2>Recent Knowledge</h2>
              <span>{articles.length} items</span>
            </div>
            <div className="cards">
              {articles.map((a) => (
                <article className="card" key={a.id}>
                  <div className="cardTop">
                    <span>{a.category}</span>
                    <small>{new Date(a.updatedAt).toLocaleDateString("ja-JP")}</small>
                  </div>
                  <h3>{a.title}</h3>
                  <p>{a.summary}</p>
                  <div className="tags">{(a.tags || []).map((t) => <b key={t}>{t}</b>)}</div>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2><Lock size={20} /> Admin</h2>
            {!token ? (
              <form onSubmit={doLogin} className="login">
                <label>Username<input value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} /></label>
                <label>Password<input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></label>
                <button>Login</button>
              </form>
            ) : (
              <div>
                <p className="ok">ログイン済み</p>
                <button onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
