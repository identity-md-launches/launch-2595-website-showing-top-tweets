import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Icon, type IconName } from "./icons";
import { posts, snapshotDate, type Post, type Topic } from "./posts";

type View = "top" | "latest" | "saved";
type Sort = "engagement" | "newest" | "likes";
type DialogState = { kind: "about" } | { kind: "share"; post: Post } | null;
const storageKey = "pond.saved.v1";
const xSearch =
  "https://x.com/search?q=identitymd%20OR%20%22identity.md%22&f=top";
const topics: ("All posts" | Topic)[] = [
  "All posts",
  "Builders",
  "Ecosystem",
  "Culture",
];
const viewNames: Record<View, string> = {
  top: "Top tweets",
  latest: "Latest tweets",
  saved: "Saved tweets",
};

function getView(): View {
  const hash = window.location.hash.slice(1);
  return hash === "saved" || hash === "latest" ? hash : "top";
}
function loadSaved() {
  let raw: string | null;
  try {
    raw = localStorage.getItem(storageKey);
  } catch {
    return { ids: [], unavailable: true };
  }
  try {
    const value: unknown = JSON.parse(raw || "[]");
    return {
      ids: Array.isArray(value)
        ? value.filter(
            (id): id is string =>
              typeof id === "string" && posts.some((p) => p.id === id),
          )
        : [],
      unavailable: false,
    };
  } catch {
    return { ids: [], unavailable: false };
  }
}
function formatCount(n: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
const engagement = (p: Post) => p.likes + p.retweets + p.replies;
const ranked = [...posts].sort(
  (a, b) =>
    engagement(b) - engagement(a) || b.createdAt.localeCompare(a.createdAt),
);

function ExternalLink({
  href,
  children,
  className,
  label,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={label}
    >
      {children}
    </a>
  );
}

function PostCard({
  post,
  saved,
  onSave,
  onShare,
}: {
  post: Post;
  saved: boolean;
  onSave: () => void;
  onShare: () => void;
}) {
  const rank = ranked.findIndex((p) => p.id === post.id) + 1;
  return (
    <article
      className={`post ${rank === 1 ? "post-featured" : ""}`}
      aria-label={`Tweet by ${post.name}`}
      data-post-id={post.id}
    >
      <div className="post-topline">
        <span className="rank">#{String(rank).padStart(2, "0")}</span>
        <span className="post-topic">
          {rank === 1 && <Icon name="fire" size={14} />}
          {post.topic}
        </span>
        <span className="post-platform" role="img" aria-label="Posted on X">
          <Icon name="x" size={16} />
        </span>
      </div>
      <header className="post-author">
        <ExternalLink
          href={`https://x.com/${post.author}`}
          className="avatar-link"
          label={`View ${post.name} on X`}
        >
          <img
            src={`./avatars/${post.avatar}`}
            width="42"
            height="42"
            alt=""
            loading="lazy"
          />
        </ExternalLink>
        <div className="author-detail">
          <ExternalLink
            href={`https://x.com/${post.author}`}
            className="author-name"
          >
            {post.name}
          </ExternalLink>
          <span className="author-handle">@{post.author}</span>
        </div>
        <time
          dateTime={post.createdAt}
          title={new Date(post.createdAt).toUTCString()}
        >
          {formatDate(post.createdAt)}
        </time>
      </header>
      <blockquote>
        <p>
          {post.quote}
          {post.excerpt && "…"}
        </p>
      </blockquote>
      <div className="post-read">
        <span>
          {post.excerpt ? "Post excerpt" : "Full text"} ·{" "}
          {new Date(post.createdAt).getUTCFullYear()}
        </span>
        <ExternalLink
          href={post.url}
          label={`Read ${post.name}’s original tweet on X`}
        >
          Read on X <Icon name="external" size={14} />
        </ExternalLink>
      </div>
      <footer className="post-actions">
        <div
          className="post-metrics"
          role="group"
          aria-label="Engagement captured in the snapshot"
        >
          <span
            title={`${post.replies} replies`}
            aria-label={`${post.replies} replies`}
          >
            <Icon name="reply" size={17} />
            {formatCount(post.replies)}
          </span>
          <span
            title={`${post.retweets} reposts`}
            aria-label={`${post.retweets} reposts`}
          >
            <Icon name="repeat" size={17} />
            {formatCount(post.retweets)}
          </span>
          <span
            title={`${post.likes} likes`}
            aria-label={`${post.likes} likes`}
          >
            <Icon name="heart" size={17} />
            {formatCount(post.likes)}
          </span>
        </div>
        <div className="post-tools">
          <button
            className="icon-button"
            onClick={onSave}
            aria-pressed={saved}
            aria-label={`${saved ? "Unsave" : "Save"} tweet by ${post.name}`}
            title={saved ? "Remove from saved tweets" : "Save tweet"}
          >
            <Icon name="bookmark" size={18} />
          </button>
          <button
            className="icon-button"
            onClick={onShare}
            aria-label={`Share tweet by ${post.name}`}
            title="Copy original tweet link"
          >
            <Icon name="share" size={18} />
          </button>
        </div>
      </footer>
    </article>
  );
}

export default function App() {
  const [view, setView] = useState<View>(getView);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string>("All posts");
  const [sort, setSort] = useState<Sort>(
    getView() === "latest" ? "newest" : "engagement",
  );
  const [savedState, setSavedState] = useState(loadSaved);
  const [announcement, setAnnouncement] = useState("");
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const shareInputRef = useRef<HTMLInputElement>(null);
  const [shareHint, setShareHint] = useState(
    "Copy the original post link, or select it to copy manually.",
  );
  const [visibleLimit, setVisibleLimit] = useState(6);

  useEffect(() => {
    const navigate = () => {
      const next = getView();
      setView(next);
      setSort(next === "latest" ? "newest" : "engagement");
      setTopic("All posts");
      setQuery("");
      setVisibleLimit(6);
    };
    window.addEventListener("hashchange", navigate);
    const storage = (event: StorageEvent) => {
      if (event.key === storageKey) setSavedState(loadSaved());
    };
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener("hashchange", navigate);
      window.removeEventListener("storage", storage);
    };
  }, []);

  useEffect(() => {
    const modal = dialogRef.current;
    if (dialogState && modal && !modal.open) {
      dialogTrigger.current = document.activeElement as HTMLElement;
      modal.showModal();
    } else if (!dialogState && modal?.open) modal.close();
  }, [dialogState]);

  const filtered = useMemo(
    () =>
      posts
        .filter((post) => {
          const text =
            `${post.name} @${post.author} ${post.quote} ${post.topic}`.toLowerCase();
          return (
            (view !== "saved" || savedState.ids.includes(post.id)) &&
            (topic === "All posts" || post.topic === topic) &&
            text.includes(query.trim().toLowerCase())
          );
        })
        .sort((a, b) =>
          sort === "newest"
            ? b.createdAt.localeCompare(a.createdAt)
            : sort === "likes"
              ? b.likes - a.likes
              : engagement(b) - engagement(a),
        ),
    [view, query, topic, sort, savedState.ids],
  );

  function resetFilters() {
    setQuery("");
    setTopic("All posts");
    setVisibleLimit(6);
    searchRef.current?.focus();
  }
  function savePost(post: Post) {
    const isSaved = savedState.ids.includes(post.id);
    const ids = isSaved
      ? savedState.ids.filter((id) => id !== post.id)
      : [...savedState.ids, post.id];
    let unavailable = savedState.unavailable;
    try {
      localStorage.setItem(storageKey, JSON.stringify(ids));
      unavailable = false;
    } catch {
      unavailable = true;
    }
    setSavedState({ ids, unavailable });
    setAnnouncement(
      `${isSaved ? "Removed from saved tweets" : "Tweet saved"}${unavailable ? " for this session only" : ""}.`,
    );
  }
  async function sharePost(post: Post) {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(post.url);
      setAnnouncement("Original tweet link copied.");
    } catch {
      setShareHint(
        "Automatic copying is unavailable. Select the link and copy it with your browser.",
      );
      setDialogState({ kind: "share", post });
    }
  }
  function closeDialog() {
    setDialogState(null);
  }
  function containDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
      ),
    ].filter((el) => el.getClientRects().length > 0);
    const first = controls[0],
      last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  const authors = [...new Map(posts.map((p) => [p.author, p])).values()];
  const navItems: { id: View; icon: IconName; label: string }[] = [
    { id: "top", icon: "fire", label: "Top tweets" },
    { id: "latest", icon: "clock", label: "Latest" },
    { id: "saved", icon: "bookmark", label: "Saved" },
  ];

  return (
    <>
      <a className="skip-link" href="#feed">
        Skip to tweets
      </a>
      <header className="site-header">
        <a href="#top" className="brand" aria-label="Pond home">
          <img src="./favicon.svg" width="38" height="38" alt="" />
          <span>
            pond<span className="brand-dot">.</span>
          </span>
        </a>
        <span className="brand-descriptor">The identity.md conversation</span>
        <div className="header-actions">
          <button
            className="text-button about-button"
            aria-label="About Pond"
            onClick={() => setDialogState({ kind: "about" })}
          >
            <Icon name="info" size={17} />
            <span>About Pond</span>
          </button>
          <ExternalLink className="button button-small" href={xSearch}>
            <Icon name="x" size={16} />
            <span>Explore on X</span>
            <Icon name="external" size={15} />
          </ExternalLink>
        </div>
      </header>
      <div className="app-layout">
        <aside className="sidebar" aria-label="Feed navigation">
          <nav className="main-nav" aria-label="Browse tweets">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={view === item.id ? "nav-link selected" : "nav-link"}
                aria-current={view === item.id ? "page" : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.id === "saved" && (
                  <span className="nav-count">{savedState.ids.length}</span>
                )}
                {item.id === "top" && (
                  <span className="nav-count">{posts.length}</span>
                )}
              </a>
            ))}
          </nav>
          <div className="sidebar-resources">
            <h2>Go deeper</h2>
            <ExternalLink href="https://imd.fun">
              <Icon name="leaf" size={18} />
              identity.md
              <Icon name="external" size={14} />
            </ExternalLink>
            <ExternalLink href="https://explorer.imd.fun">
              <Icon name="grid" size={18} />
              Swarm explorer
              <Icon name="external" size={14} />
            </ExternalLink>
          </div>
          <div className="sidebar-note">
            <span className="mini-logo">
              <img src="./favicon.svg" width="24" height="24" alt="" />
              Independent reader
            </span>
            <p>Posts and counts are a snapshot.</p>
            <button
              className="text-link"
              onClick={() => setDialogState({ kind: "about" })}
            >
              Sources & methodology <Icon name="arrow" size={14} />
            </button>
          </div>
        </aside>
        <main id="main" className="main-content">
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <h1 id="hero-title">
                The swamp
                <br />
                has <span>signal.</span>
              </h1>
              <p>Top tweets from the identity.md ecosystem.</p>
              <a href="#feed" className="button button-primary">
                Find the signal <Icon name="arrow" size={17} />
              </a>
            </div>
            <img
              className="hero-art"
              src="./art/ai-pepe-squad.webp"
              width="1500"
              height="750"
              alt="Three Pepe operators armed with an AI blaster, a laptop, and a glowing drone in a green swamp."
              fetchPriority="high"
            />
          </section>
          <nav className="mobile-nav" aria-label="Browse tweets">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={view === item.id ? "selected" : ""}
                aria-current={view === item.id ? "page" : undefined}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
                {item.id === "saved" && <span>{savedState.ids.length}</span>}
              </a>
            ))}
          </nav>
          <div className="content-columns">
            <section
              className="feed"
              id="feed"
              aria-labelledby="feed-heading"
              tabIndex={-1}
            >
              <div className="feed-heading">
                <h2 id="feed-heading">
                  {viewNames[view]}
                  <span className="result-badge">{filtered.length}</span>
                </h2>
                <label className="sort-control">
                  <span className="sr-only">Sort tweets</span>
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value as Sort);
                      setVisibleLimit(6);
                    }}
                  >
                    <option value="engagement">Top engagement</option>
                    <option value="newest">Newest first</option>
                    <option value="likes">Most liked</option>
                  </select>
                  <Icon name="chevron" size={15} />
                </label>
              </div>
              <div className="search-field">
                <label htmlFor="tweet-search">
                  <Icon name="search" size={19} />
                  <span>Search</span>
                </label>
                <input
                  ref={searchRef}
                  id="tweet-search"
                  name="search"
                  type="search"
                  autoComplete="off"
                  placeholder="Tweets, people, keywords…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setVisibleLimit(6);
                  }}
                />
                {query && (
                  <button
                    className="icon-button"
                    onClick={() => {
                      setQuery("");
                      searchRef.current?.focus();
                    }}
                    aria-label="Clear search"
                  >
                    <Icon name="close" size={17} />
                  </button>
                )}
              </div>
              <div
                className="topic-filters"
                role="group"
                aria-label="Filter by topic"
              >
                {topics.map((t) => (
                  <button
                    key={t}
                    aria-pressed={topic === t}
                    onClick={() => {
                      setTopic(t);
                      setVisibleLimit(6);
                    }}
                    className={topic === t ? "active" : ""}
                  >
                    {t === "All posts" && <Icon name="grid" size={15} />} {t}
                  </button>
                ))}
              </div>
              <div className="snapshot-line">
                <span>
                  {view === "saved"
                    ? "Saved in this browser"
                    : `Snapshot · ${snapshotDate}`}
                </span>
                <button
                  onClick={() => setDialogState({ kind: "about" })}
                  aria-label="About the snapshot and ranking"
                >
                  <Icon name="info" size={15} />
                  <span>How it works</span>
                </button>
              </div>
              <p className="sr-only" role="status">
                {filtered.length} {filtered.length === 1 ? "tweet" : "tweets"}
                {query ? ` matching ${query}` : ""}
                {topic !== "All posts" ? ` in ${topic}` : ""}
              </p>
              {savedState.unavailable && (
                <div className="storage-note" role="note">
                  <Icon name="info" size={18} />
                  Browser storage is unavailable. Saved tweets will last for
                  this session.
                </div>
              )}
              <div className="post-list">
                {filtered.slice(0, visibleLimit).map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    saved={savedState.ids.includes(post.id)}
                    onSave={() => savePost(post)}
                    onShare={() => void sharePost(post)}
                  />
                ))}
              </div>
              {!filtered.length && (
                <div className="empty-state">
                  <Icon
                    name={
                      view === "saved" && !query && topic === "All posts"
                        ? "bookmark"
                        : "search"
                    }
                    size={32}
                  />
                  <h3>
                    {view === "saved" && !query && topic === "All posts"
                      ? "Keep the good ones."
                      : "No tweets found."}
                  </h3>
                  <p>
                    {view === "saved" && !query && topic === "All posts"
                      ? "Save a tweet with the bookmark button. Find it here whenever you return."
                      : `No matches${query ? ` for “${query}”` : ""}${topic !== "All posts" ? ` in ${topic}` : ""}. Try another keyword or clear the filters.`}
                  </p>
                  {view === "saved" && !query && topic === "All posts" ? (
                    <a href="#top" className="button button-primary">
                      Explore top tweets <Icon name="arrow" size={17} />
                    </a>
                  ) : (
                    <button className="button" onClick={resetFilters}>
                      Clear filters <Icon name="close" size={17} />
                    </button>
                  )}
                </div>
              )}
              {filtered.length > visibleLimit && (
                <button
                  className="load-more button"
                  onClick={() => setVisibleLimit((n) => n + 6)}
                >
                  Show {Math.min(filtered.length - visibleLimit, 6)} more tweets{" "}
                  <Icon name="chevron" size={17} />
                </button>
              )}
              {filtered.length > 0 && filtered.length <= visibleLimit && (
                <div className="feed-end">
                  <Icon name="check" size={17} />
                  <span>All {filtered.length} tweets in this view.</span>
                  <ExternalLink href={xSearch}>
                    Keep exploring on X <Icon name="external" size={14} />
                  </ExternalLink>
                </div>
              )}
            </section>
            <aside className="right-rail" aria-label="About the conversation">
              <section className="people-section">
                <div className="rail-heading">
                  <h2>In the conversation</h2>
                  <Icon name="reply" size={18} />
                </div>
                <p className="rail-description">
                  A few voices from this snapshot.
                </p>
                <ul className="people-list">
                  {authors.slice(0, 5).map((author) => (
                    <li key={author.author}>
                      <ExternalLink
                        href={`https://x.com/${author.author}`}
                        label={`View ${author.name} on X`}
                      >
                        <img
                          src={`./avatars/${author.avatar}`}
                          width="36"
                          height="36"
                          alt=""
                          loading="lazy"
                        />
                        <span>
                          <strong>{author.name}</strong>
                          <span>@{author.author}</span>
                        </span>
                        <Icon name="external" size={14} />
                      </ExternalLink>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="about-feed">
                <h2>About this snapshot</h2>
                <p>
                  A selected snapshot of {posts.length} tweets about
                  identity.md. Ranked by captured likes, reposts, and replies.
                </p>
                <button
                  className="text-link"
                  onClick={() => setDialogState({ kind: "about" })}
                >
                  See sources & ranking <Icon name="arrow" size={16} />
                </button>
              </section>
              <ExternalLink href="https://imd.fun" className="ecosystem-link">
                <span
                  className="ecosystem-art"
                  role="img"
                  aria-label="AI Pepe squad"
                />
                <span className="ecosystem-link-copy">
                  <strong>Explore identity.md</strong>
                  <span>
                    Visit the ecosystem <Icon name="external" size={15} />
                  </span>
                </span>
              </ExternalLink>
              <p className="rail-footnote">
                Pond is an independent reader.
                <br />
                Not affiliated with X or identity.md.
              </p>
            </aside>
          </div>
          <footer className="site-footer">
            <a href="#top" className="footer-brand">
              <img src="./favicon.svg" width="22" height="22" alt="" />
              pond.
            </a>
            <span>The identity.md conversation</span>
            <button
              className="text-link"
              onClick={() => setDialogState({ kind: "about" })}
            >
              About & sources
            </button>
          </footer>
        </main>
      </div>
      <div role="status" className="sr-only">
        {announcement}
      </div>
      {announcement && (
        <div className="toast">
          <Icon name="check" size={18} />
          <span>{announcement}</span>
          <button
            className="icon-button"
            onClick={() => setAnnouncement("")}
            aria-label="Dismiss notification"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <dialog
        ref={dialogRef}
        className="dialog"
        aria-labelledby="dialog-title"
        onKeyDown={containDialogFocus}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeDialog();
        }}
        onClose={() => {
          setDialogState(null);
          dialogTrigger.current?.focus();
        }}
      >
        <div className="dialog-top">
          <img src="./favicon.svg" width="36" height="36" alt="" />
          <button
            className="icon-button"
            onClick={closeDialog}
            aria-label="Close dialog"
            autoFocus
          >
            <Icon name="close" />
          </button>
        </div>
        {dialogState?.kind === "about" ? (
          <>
            <h2 id="dialog-title">A clearer view of the pond.</h2>
            <p>
              Pond is an independent reader for the identity.md conversation. No
              account needed.
            </p>
            <h3>What “top” means</h3>
            <p>
              These {posts.length} selected posts are ranked by the sum of
              likes, reposts, and replies captured on {snapshotDate}. This is a
              static snapshot, not an exhaustive or live X leaderboard. Rank
              numbers always refer to the full snapshot.
            </p>
            <h3>The posts and their sources</h3>
            <p>
              Text is attributed to its original author. Longer posts use marked
              excerpts. Counts were retrieved through the public FxTwitter API
              and may have changed. Claims are the authors’ own.
            </p>
            <ul className="source-list">
              {ranked.map((post) => (
                <li key={post.id}>
                  <ExternalLink href={post.url}>
                    {post.name} · {formatDate(post.createdAt)},{" "}
                    {new Date(post.createdAt).getUTCFullYear()}
                    <Icon name="external" size={14} />
                  </ExternalLink>
                </li>
              ))}
            </ul>
            <h3>Saved stays with you</h3>
            <p>
              Bookmarks live only in this browser’s local storage. They are not
              sent to a server or synced to X. If browser storage is blocked,
              bookmarks last for the current session.
            </p>
            <p className="dialog-footnote">
              Community project. Not affiliated with X or identity.md. Pepe
              artwork is AI-generated for Pond.
            </p>
          </>
        ) : dialogState?.kind === "share" ? (
          <>
            <h2 id="dialog-title">Share this tweet</h2>
            <p id="share-hint">{shareHint}</p>
            <label className="share-label" htmlFor="share-url">
              Original post link
            </label>
            <input
              className="share-input"
              id="share-url"
              ref={shareInputRef}
              readOnly
              value={dialogState.post.url}
              aria-describedby="share-hint"
              onFocus={(e) => e.target.select()}
            />
            <button
              className="button button-primary"
              onClick={() => {
                shareInputRef.current?.focus();
                shareInputRef.current?.select();
                setShareHint(
                  "Link selected. Use your browser’s Copy action or press Ctrl+C (⌘C on Mac).",
                );
              }}
            >
              Select link <Icon name="share" size={17} />
            </button>
          </>
        ) : null}
      </dialog>
    </>
  );
}
