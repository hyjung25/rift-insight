"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Crosshair,
  Eye,
  FlaskConical,
  Globe2,
  LayoutDashboard,
  Lightbulb,
  LoaderCircle,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { champions, eligible, kda, perMinute, summarize } from "@/lib/metrics";
import { recentPatterns } from "@/lib/insights";
import { type Analysis, type Match, type Server, roleNames } from "@/lib/types";
import { validateInput } from "@/lib/validation";
import { ChampionChart, FarmingChart } from "./charts";
const portrait = (name: string) =>
  `/assets/${["Ahri", "Syndra", "Orianna", "Akali", "Yone"].includes(name) ? name : "fallback"}.png`;
function ChampionImage({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const src = ["Ahri", "Syndra", "Orianna", "Akali", "Yone"].includes(name)
    ? portrait(name)
    : `https://ddragon.leagueoflegends.com/cdn/16.18.1/img/champion/${name === "FiddleSticks" ? "Fiddlesticks" : encodeURIComponent(name)}.png`;
  return broken ? (
    <span className={`portrait fallback ${className}`} aria-label={name}>
      {name.slice(0, 2)}
    </span>
  ) : (
    <img
      className={`portrait ${className}`}
      src={src}
      alt={name}
      onError={() => setBroken(true)}
    />
  );
}
const fmt = (n: number, digits = 1) =>
  n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
function MatchRow({ match: m }: { match: Match }) {
  const date = m.startedAt
    ? new Date(m.startedAt).toISOString().slice(0, 10)
    : "Unknown date";
  return (
    <details
      className={`match-row ${m.excluded ? "excluded" : m.win ? "win" : "loss"}`}
    >
      <summary>
        <div className="result">
          <strong>
            {m.excluded ? "Excluded" : m.win ? "Victory" : "Defeat"}
          </strong>
          <small>Ranked Solo</small>
        </div>
        <ChampionImage name={m.champion} />
        <div className="champion-name">
          <strong>{m.champion}</strong>
          <small>{roleNames[m.role]}</small>
        </div>
        <div className="match-kda">
          <strong>
            {m.excluded ? (
              "—"
            ) : (
              <>
                {m.kills} <i>/</i> <span>{m.deaths}</span> <i>/</i> {m.assists}
              </>
            )}
          </strong>
          <small>
            {m.excluded
              ? m.excluded
              : `${fmt(kda(m.kills, m.deaths, m.assists), 2)} KDA`}
          </small>
        </div>
        <div className="match-cs">
          <strong>
            {m.excluded ? "—" : fmt(perMinute(m.cs, m.duration))}{" "}
            <small>CS/min</small>
          </strong>
          <small>{m.excluded ? "Not analyzed" : `${m.cs} CS`}</small>
        </div>
        <div className="match-date">
          <span>
            {Math.floor(m.duration / 60)}m {Math.floor(m.duration % 60)}s
          </span>
          <small>{date}</small>
        </div>
        <ChevronDown size={15} className="row-chevron" />
      </summary>
      <div className="match-detail">
        <span>
          Match <strong>{m.id}</strong>
        </span>
        {m.excluded ? (
          <span>
            {m.excluded} — not included in statistics, charts, or patterns.
          </span>
        ) : (
          <>
            <span>
              Champion damage{" "}
              <strong>
                {fmt(m.damage, 0)} · {fmt(perMinute(m.damage, m.duration), 0)}
                /min
              </strong>
            </span>
            <span>
              Vision score{" "}
              <strong>
                {m.vision} · {fmt(perMinute(m.vision, m.duration), 2)}/min
              </strong>
            </span>
          </>
        )}
      </div>
    </details>
  );
}
export default function Dashboard({
  initial,
  liveAvailable,
}: {
  initial: Analysis | null;
  liveAvailable: boolean;
}) {
  const [data, setData] = useState(initial),
    [id, setId] = useState(""),
    [server, setServer] = useState<Server>("KR");
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [champion, setChampion] = useState("all"),
    [role, setRole] = useState("all"),
    [tab, setTab] = useState("overview"),
    [showAll, setShowAll] = useState(false),
    [help, setHelp] = useState(false);
  useEffect(() => {
    if (!help) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [help]);
  const filtered = useMemo(
    () =>
      (data?.matches ?? []).filter(
        (m) =>
          (champion === "all" || m.champion === champion) &&
          (role === "all" || m.role === role),
      ),
    [data, champion, role],
  );
  const stats = summarize(filtered),
    rows = eligible(filtered),
    championRows = champions(filtered),
    patterns = recentPatterns(filtered);
  const exclusions = filtered.length - rows.length;
  async function analyze(demo = false) {
    setError("");
    const body = { riotId: demo ? "Rift Explorer#DEMO" : id, server, demo };
    try {
      validateInput(body);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          `${result.error}${result.retryAfter ? ` Retry after ${result.retryAfter} seconds.` : ""}`,
        );
      setData(result);
      setChampion("all");
      setRole("all");
      setShowAll(false);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load this player. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    void analyze();
  }
  function resetFilters() {
    setChampion("all");
    setRole("all");
    setShowAll(false);
  }
  const metrics = [
    {
      label: "Win rate",
      value: `${fmt(stats.winRate, 0)}%`,
      detail: `${stats.wins} wins · ${stats.losses} losses`,
      icon: Trophy,
      color: "teal",
    },
    {
      label: "Average K / D / A",
      value: `${fmt(stats.kills)} / ${fmt(stats.deaths)} / ${fmt(stats.assists)}`,
      detail: `${fmt(stats.kda, 2)} aggregate KDA`,
      icon: Swords,
      color: "blue",
    },
    {
      label: "CS per minute",
      value: fmt(stats.cs),
      detail: "Minions + jungle monsters",
      icon: Crosshair,
      color: "blue",
    },
    {
      label: "Damage per minute",
      value: fmt(stats.damage, 0),
      detail: "Damage to champions",
      icon: Target,
      color: "purple",
    },
    {
      label: "Vision per minute",
      value: fmt(stats.vision, 2),
      detail: "Vision score / minutes",
      icon: Eye,
      color: "gold",
    },
  ];
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to dashboard
      </a>
      <aside className="sidebar" inert={help}>
        <a className="brand" href="/" aria-label="Rift Insight home">
          <span className="brand-mark">
            <Activity size={25} />
          </span>
          <span>
            RIFT<span className="brand-light"> INSIGHT</span>
          </span>
        </a>
        <div className="game-label">
          <span className="game-icon">L</span>
          <div>
            League of Legends<small>PLAYER ANALYTICS</small>
          </div>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <button
            className={tab === "overview" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("overview")}
          >
            <LayoutDashboard size={18} /> Overview <ChevronRight size={15} />
          </button>
          <button
            className={tab === "champions" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("champions")}
          >
            <Shield size={18} /> Champions
          </button>
          <button
            className={tab === "history" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("history")}
          >
            <Clock3 size={18} /> Match history
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="small-card">
            <span className="small-icon">
              <Lightbulb size={18} />
            </span>
            <strong>Every game tells a story.</strong>
            <p>Find the patterns in yours.</p>
            <a href="#metrics" onClick={() => setTab("overview")}>
              Understand your stats <ArrowUpRight size={14} />
            </a>
          </div>
          <button className="nav-item" onClick={() => setHelp(true)}>
            <BookOpen size={18} /> About this project <ArrowUpRight size={14} />
          </button>
          <div className="sidebar-status">
            <span className="status-dot" /> Built on the Riot Games API
          </div>
        </div>
      </aside>
      <div className="main-shell" inert={help}>
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <ChevronRight size={13} />
            <span>
              {tab === "overview"
                ? "Player overview"
                : tab === "champions"
                  ? "Champions"
                  : "Match history"}
            </span>
          </div>
          <div className="topbar-right">
            <span className="version">V1.0</span>
            <button
              aria-label="About Rift Insight"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={19} />
            </button>
            <span className="avatar">RI</span>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR GAME. A CLEARER PICTURE.</div>
              <h1>
                Player overview<span>.</span>
              </h1>
              <p>A little perspective for your next game on the Rift.</p>
            </div>
            <span className="queue-pill">
              <span className="status-dot" /> Ranked Solo / Duo
            </span>
          </div>
          <form className="search-form" onSubmit={submit}>
            <Search size={20} />
            <label className="sr-only" htmlFor="riot-id">
              Riot ID
            </label>
            <input
              id="riot-id"
              placeholder="Search Riot ID · gameName#tagLine"
              value={id}
              onChange={(e) => setId(e.target.value)}
              maxLength={30}
              required
              autoComplete="off"
            />
            <div className="server-select">
              <Globe2 size={16} />
              <label className="sr-only" htmlFor="server">
                Server
              </label>
              <select
                id="server"
                value={server}
                onChange={(e) => setServer(e.target.value as Server)}
              >
                <option value="KR">Korea (KR)</option>
                <option value="NA">North America (NA)</option>
              </select>
            </div>
            <button className="primary-button" disabled={loading} type="submit">
              {loading ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Search size={16} />
              )}
              <span>{loading ? "Analyzing…" : "Analyze player"}</span>
              <ArrowRight size={16} />
            </button>
          </form>
          {error && (
            <div className="error-box" role="alert">
              <strong>We couldn’t load that player.</strong>
              <p>{error}</p>
              <button onClick={() => void analyze(true)}>
                Explore demo data <ArrowRight size={14} />
              </button>
            </div>
          )}
          {loading && (
            <div className="loading-state" role="status">
              <LoaderCircle className="spin" />
              <h2>Putting the pieces together</h2>
              <p>Finding the account and retrieving up to 20 ranked matches…</p>
              <div className="loading-track" />
            </div>
          )}
          {!loading && !data && (
            <div className="welcome panel">
              <div className="welcome-icon">
                <Swords size={32} />
              </div>
              <h2>Your next insight starts here.</h2>
              <p>
                Enter a Riot ID above to explore recent ranked performance.
                <br />
                Or take a look around with a sample player.
              </p>
              <button
                className="primary-button"
                onClick={() => void analyze(true)}
              >
                Explore the demo <ArrowRight size={16} />
              </button>
            </div>
          )}
          {data && !loading && (
            <>
              {data.mode === "demo" && (
                <div className="demo-banner">
                  <FlaskConical size={16} />
                  <strong>You’re exploring demo data</strong>
                  <span>
                    Realistic sample matches. Not a real player’s history.
                  </span>
                  <button onClick={() => setHelp(true)}>
                    {liveAvailable
                      ? "How live lookup works"
                      : "Connect your API key"}{" "}
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              )}
              {data.notices.map((notice, i) => (
                <div className="notice" role="status" key={i}>
                  {notice}
                </div>
              ))}
              <section className="player-banner">
                <div className="player-content">
                  <div className="player-portrait">
                    <ChampionImage
                      name={champions(data.matches)[0]?.name ?? "Ahri"}
                    />
                    <span>
                      <Swords size={13} />
                    </span>
                  </div>
                  <div>
                    <div className="player-badges">
                      <span>
                        {data.server === "KR" ? "KOREA" : "NORTH AMERICA"}
                      </span>
                      <span className="sample-badge">
                        {data.mode === "demo" ? "DEMO PROFILE" : "LIVE PROFILE"}
                      </span>
                    </div>
                    <h2>
                      {data.riotId.split("#")[0]}{" "}
                      <span>#{data.riotId.split("#")[1]}</span>
                    </h2>
                    <div className="player-meta">
                      <span>
                        <BarChart3 size={14} /> {eligible(data.matches).length}{" "}
                        matches analyzed
                      </span>
                      <i>·</i>
                      <span>Ranked Solo / Duo</span>
                    </div>
                  </div>
                </div>
                <div className="banner-caption">
                  <span>THE RECENT PICTURE</span>
                  <strong>Learn from every match.</strong>
                  <small>Up to 20 recent ranked games</small>
                </div>
              </section>
              <div className="dashboard-toolbar">
                <div className="tabs" aria-label="Dashboard views">
                  {[
                    ["overview", "Overview"],
                    ["champions", "Champions"],
                    ["history", "Match history"],
                  ].map(([key, name]) => (
                    <button
                      aria-pressed={tab === key}
                      className={tab === key ? "selected" : ""}
                      key={key}
                      onClick={() => setTab(key)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <span className="sample-note">
                  <Clock3 size={13} /> Recent matches, not season totals
                </span>
              </div>
              <div className="filter-row">
                <div className="filter-title">
                  <SlidersHorizontal size={16} /> Filter your view{" "}
                  <span>{stats.count} matches</span>
                </div>
                <div className="filters">
                  <select
                    aria-label="Filter by champion"
                    value={champion}
                    onChange={(e) => {
                      setChampion(e.target.value);
                      setShowAll(false);
                    }}
                  >
                    <option value="all">All champions</option>
                    {[...new Set(data.matches.map((m) => m.champion))]
                      .sort()
                      .map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                  </select>
                  <select
                    aria-label="Filter by role"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setShowAll(false);
                    }}
                  >
                    <option value="all">All roles</option>
                    {Object.entries(roleNames).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                  {(champion !== "all" || role !== "all") && (
                    <button className="reset" onClick={resetFilters}>
                      <X size={13} /> Reset
                    </button>
                  )}
                </div>
              </div>
              {exclusions > 0 && (
                <div className="notice">
                  {exclusions} displayed{" "}
                  {exclusions === 1 ? "match is" : "matches are"} excluded from
                  statistics, charts, and patterns: remakes, games under 5
                  minutes, or incomplete data. See match history for reasons.
                </div>
              )}
              {!stats.count && (
                <div className="empty-state panel">
                  <Search size={27} />
                  <h2>No eligible matches in this view</h2>
                  <p>
                    {data.matches.length
                      ? "Try another champion or role. Excluded records remain in match history."
                      : "No recent ranked solo/duo matches were returned for this server."}
                  </p>
                  {(champion !== "all" || role !== "all") && (
                    <button onClick={resetFilters}>Clear filters</button>
                  )}
                </div>
              )}
              {stats.count > 0 && tab === "overview" && (
                <>
                  <section
                    className="stats-grid"
                    aria-label="Aggregate statistics"
                  >
                    {metrics.map(
                      ({ label, value, detail, icon: Icon, color }) => (
                        <div className={`stat-card ${color}`} key={label}>
                          <div className="stat-label">
                            {label}
                            <Icon size={16} />
                          </div>
                          <div
                            className={`stat-value ${label.includes("Average") ? "kda-value" : ""}`}
                          >
                            {value}
                          </div>
                          <div className="stat-detail">{detail}</div>
                          {label === "Win rate" && (
                            <div className="win-meter">
                              <span style={{ width: `${stats.winRate}%` }} />
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </section>
                  <div className="charts-grid">
                    <section className="panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Champion win rates</h2>
                          <p>A closer look at your picks</p>
                        </div>
                        <span className="subtle-tag">
                          {championRows.length} champions
                        </span>
                      </div>
                      <ChampionChart matches={rows} />
                      <div className="chart-footnote">
                        <CircleHelp size={12} /> Small samples can vary. Game
                        counts are shown for context.
                      </div>
                    </section>
                    <section className="panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Farming over time</h2>
                          <p>CS per minute, match by match</p>
                        </div>
                        <span className="chart-legend">
                          <i /> CS/min
                        </span>
                      </div>
                      <FarmingChart matches={rows} />
                      <div className="chart-footnote">
                        <span className="line-key" /> {rows.length} matches ·
                        oldest to newest
                      </div>
                    </section>
                  </div>
                  <section className="patterns">
                    <div className="patterns-heading">
                      <span className="insight-icon">
                        <Sparkles size={18} />
                      </span>
                      <div>
                        <h2>Recent patterns</h2>
                        <p>A few things your matches tell us</p>
                      </div>
                      <span className="subtle-tag">DATA, NOT GUESSWORK</span>
                    </div>
                    <div className="pattern-grid">
                      {patterns.map((p) => (
                        <div className="pattern" key={p.title}>
                          {p.kind === "trend" ? (
                            <TrendingUp size={18} />
                          ) : (
                            <Crosshair size={18} />
                          )}
                          <div>
                            <h3>{p.title}</h3>
                            <p>{p.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <small>
                      Observations from this filtered sample. No rank benchmarks
                      or coaching claims.
                    </small>
                  </section>
                </>
              )}
              <div
                className={
                  tab === "overview" ? "bottom-grid" : "single-section"
                }
              >
                {tab !== "history" && stats.count > 0 && (
                  <section className="panel champion-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Champion performance</h2>
                        <p>Your picks, by the numbers</p>
                      </div>
                      <Shield size={17} />
                    </div>
                    <div className="champion-table">
                      <div className="champion-table-head">
                        <span>CHAMPION</span>
                        <span>WIN RATE</span>
                        <span>KDA</span>
                      </div>
                      {championRows.map((c) => (
                        <button
                          className="champion-table-row"
                          key={c.name}
                          onClick={() => {
                            setChampion(c.name);
                            setShowAll(false);
                          }}
                          aria-label={`Filter to ${c.name}`}
                        >
                          <div>
                            <ChampionImage name={c.name} />
                            <span>
                              <strong>{c.name}</strong>
                              <small>{c.count} games</small>
                            </span>
                          </div>
                          <div>
                            <strong
                              className={c.winRate >= 50 ? "teal-text" : ""}
                            >
                              {fmt(c.winRate, 0)}%
                            </strong>
                            <small>
                              {c.wins}W · {c.losses}L
                            </small>
                          </div>
                          <div>
                            <strong>{fmt(c.kda, 2)}</strong>
                            <small>KDA</small>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="table-footer">
                      Select a champion to explore their matches{" "}
                      <ArrowRight size={13} />
                    </div>
                  </section>
                )}
                {tab !== "champions" && (
                  <section className="history-section">
                    <div className="panel-heading">
                      <div>
                        <h2>
                          Match history{" "}
                          <span className="count-badge">{filtered.length}</span>
                        </h2>
                        <p>Your most recent games on the Rift</p>
                      </div>
                      <span className="history-sort">
                        Newest first <ArrowDown size={13} />
                      </span>
                    </div>
                    <div className="match-list">
                      {filtered.slice(0, showAll ? 20 : 5).map((m) => (
                        <MatchRow match={m} key={m.id} />
                      ))}
                    </div>
                    {filtered.length > 5 && (
                      <button
                        className="load-more"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll
                          ? "Show fewer matches"
                          : `View all ${filtered.length} matches`}
                        <ChevronDown
                          size={15}
                          style={{
                            transform: showAll ? "rotate(180deg)" : undefined,
                          }}
                        />
                      </button>
                    )}
                    {!filtered.length && (
                      <p className="muted">No matches to display.</p>
                    )}
                  </section>
                )}
              </div>
            </>
          )}
          <details className="metrics-explanation" id="metrics">
            <summary>
              <CircleHelp size={16} /> How metrics are calculated{" "}
              <ChevronDown size={16} />
            </summary>
            <div>
              <p>
                Every statistic, chart, and pattern uses only eligible retrieved
                matches that match both selected filters. Win rate is wins /
                games. Average K/D/A is the mean of each field. Aggregate KDA is
                (total kills + total assists) / max(1, total deaths); a
                deathless sample uses 1 as the denominator.
              </p>
              <p>
                CS is lane minions + neutral monsters. Dashboard CS, champion
                damage, and vision rates divide totals by total minutes
                (duration-weighted). The time chart and match rows show
                individual match rates. The farming pattern compares the
                arithmetic mean of per-match CS/min in the latest 5 and previous
                5 eligible matches.
              </p>
              <p>
                Remakes flagged as early surrender, games under 5 minutes, and
                records missing core metrics are excluded, with a reason shown
                in history. Unknown roles remain eligible and can be filtered.
                No records are replaced with invented values. Dates are UTC.
                This small recent sample is not a season record or a measure of
                overall skill.
              </p>
            </div>
          </details>
          <footer>
            <div>
              <span className="footer-brand">
                <Activity size={16} /> RIFT INSIGHT
              </span>
              <span>Less noise. More perspective.</span>
            </div>
            <p>
              Rift Insight is not endorsed by Riot Games and does not reflect
              the views or opinions of Riot Games or anyone officially involved
              in producing or managing Riot Games properties. Riot Games and all
              associated properties are trademarks or registered trademarks of
              Riot Games, Inc.
            </p>
          </footer>
        </main>
      </div>
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setHelp(false);
              if (e.key === "Tab") {
                e.preventDefault();
              }
            }}
          >
            <button
              autoFocus
              className="modal-close"
              aria-label="Close project information"
              onClick={() => setHelp(false)}
            >
              <X size={20} />
            </button>
            <span className="eyebrow">A CLEARER VIEW OF YOUR GAME</span>
            <h2 id="help-title">Meet Rift Insight.</h2>
            <p>
              A focused League of Legends analytics project built with Next.js,
              TypeScript, and Riot’s public API.
            </p>
            <h3>
              {liveAvailable
                ? "Live lookups are configured"
                : "Connect your Riot API key"}
            </h3>
            <p>
              {liveAvailable
                ? "Enter gameName#tagLine, choose NA or KR, and select Analyze player. Riot requests run only on the server."
                : "Copy .env.example to .env.local, replace the placeholder in RIOT_API_KEY with your Riot developer key, and restart the app. Never put the key in a public environment variable."}
            </p>
            <div className="modal-note">
              <FlaskConical size={20} />
              <p>
                Demo mode uses 20 fixed, synthetic matches for Rift
                Explorer#DEMO. Live request failures always display an error;
                they never switch to demo data.
              </p>
            </div>
            <p className="muted">
              The README includes setup, API flow, formulas, and public
              deployment requirements. Champion art comes from Riot’s official
              Data Dragon.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
