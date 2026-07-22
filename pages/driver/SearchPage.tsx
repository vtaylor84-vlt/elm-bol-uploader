import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MissionShell from '../../components/mission-control/MissionShell.tsx';
import EmptyState from '../../design-system/components/EmptyState.tsx';
import { useDriverExperience } from '../../context/DriverExperienceContext.tsx';
import type { SearchResultKind } from '../../services/dataSource/types.ts';

const KIND_LABEL: Record<SearchResultKind, string> = {
  load: 'Trips',
  document: 'Documents',
  message: 'Messages',
  pay: 'Pay',
  resource: 'Resources',
};

/** Map approved aliases into the search query before filtering. */
function normalizeSearchQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\bloads?\b/g, 'trip')
    .replace(/\bassistant\b/g, 'elm ai')
    .replace(/\btoday\b/g, 'home')
    .replace(/\bequipment\b/g, 'vehicle')
    .replace(/\btimeline\b/g, 'activity');
}

/** Search — filters the Showcase search index by title/subtitle. Production shows a polite empty state. */
const SearchPage: React.FC = () => {
  const { mode, dataSource } = useDriverExperience();
  const index = dataSource.getSearchIndex?.() ?? [];
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = normalizeSearchQuery(query);
    if (!q) return index;
    return index.filter((r) => {
      const hay = `${r.title} ${r.subtitle} ${r.kind}`.toLowerCase();
      const aliased = hay
        .replace(/\bloads?\b/g, 'trip')
        .replace(/\bassistant\b/g, 'elm ai');
      return aliased.includes(q) || hay.includes(q);
    });
  }, [index, query]);

  const grouped = useMemo(() => {
    const groups = new Map<SearchResultKind, typeof results>();
    results.forEach((r) => {
      const list = groups.get(r.kind) || [];
      list.push(r);
      groups.set(r.kind, list);
    });
    return groups;
  }, [results]);

  return (
    <MissionShell title="Search" activeNav="more">
      <div className="space-y-6">
        <header>
          <p className="mc-kicker">Search</p>
          <h1 className="mc-page-title">Find anything</h1>
          <p className="mc-section-copy">
            {mode === 'showcase'
              ? 'Demonstration data only — searches Showcase trips, documents, messages, and resources. Aliases like Loads → Trips and Assistant → ELM AI are recognized.'
              : 'Search across trips, documents, and messages will be available when connected.'}
          </p>
        </header>

        {index.length === 0 ? (
          <EmptyState
            kicker="Search"
            title="Search isn't available yet"
            description="Search across trips, documents, and messages will show up here once connected."
          />
        ) : (
          <>
            <input
              type="search"
              className="elm-input"
              placeholder="Search trips, documents, messages…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search"
            />

            {results.length === 0 ? (
              <p className="mc-section-copy">No results for &quot;{query}&quot;.</p>
            ) : (
              <div className="space-y-5">
                {Array.from(grouped.entries()).map(([kind, items]) => (
                  <div key={kind}>
                    <p className="mc-kicker mb-2">{KIND_LABEL[kind]}</p>
                    <ul className="mc-task-list">
                      {items.map((r) => (
                        <li key={r.id}>
                          <Link to={r.href} className="mc-task-row mc-task-row-link">
                            <div className="min-w-0 flex-1">
                              <p className="mc-task-title">{r.title}</p>
                              <p className="mc-task-detail">{r.subtitle}</p>
                            </div>
                            <span className="mc-capability-chip">{r.disclosure}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </MissionShell>
  );
};

export default SearchPage;
