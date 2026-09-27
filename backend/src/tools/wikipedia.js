async function searchWikipedia(query) {
  if (!query || typeof query !== "string") {
    throw new Error("Search query is required.");
  }

  if (query.length > 200) {
    throw new Error(
      "Search query is too long."
    );
  }

  const url =
    `https://en.wikipedia.org/w/api.php` +
    `?action=query` +
    `&list=search` +
    `&srsearch=${encodeURIComponent(query)}` +
    `&srlimit=5` +
    `&format=json` +
    `&origin=*`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      "Wikipedia search failed."
    );
  }

  const data = await response.json();

  const results =
    data?.query?.search || [];

  return results.map((item) => ({
    title: item.title,
    snippet: item.snippet
      .replace(/<[^>]*>/g, ""),
    page_id: item.pageid,
    url:
      `https://en.wikipedia.org/wiki/` +
      encodeURIComponent(
        item.title.replace(/ /g, "_")
      ),
  }));
}

module.exports = {
  searchWikipedia,
};