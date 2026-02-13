// interface SearchConfig and type SearchQuery comments are documentation-only and should not be flagged.
// interface Demo in doc comments should not count as declarations.
const mockMessage =
  "interface Sample {} and type Sample and enum Sample are not declarations here.";

/**
 * type SearchConfig in comment only.
 * enum SearchStatus in comment only.
 */
const templateBlock = `
  interface FakeFromTemplate {
    text: string;
  }
  type FakeFromTemplate = { text: string };
  enum FakeFromTemplate { One, Two }
`;

interface SearchPageConfig {
  title: string;
}

type SearchQuery = {
  text: string;
};

enum SearchStatus {
  Idle,
  Loading,
  Ready,
}

export const Home = () => {
  return <div>{SearchPageConfig.name}</div>;
};
