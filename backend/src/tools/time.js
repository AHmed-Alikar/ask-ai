async function getTime(location) {
  if (!location || typeof location !== "string") {
    throw new Error("Location is required.");
  }

  const geoUrl =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(location)}` +
    `&count=1` +
    `&language=en` +
    `&format=json`;

  const geoResponse = await fetch(geoUrl);

  if (!geoResponse.ok) {
    throw new Error("Location search failed.");
  }

  const geoData = await geoResponse.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(
      `Could not find location: ${location}`
    );
  }

  const place = geoData.results[0];

  if (!place.timezone) {
    throw new Error(
      "Timezone information is unavailable."
    );
  }

  const now = new Date();

  const formattedTime =
    new Intl.DateTimeFormat("en-US", {
      timeZone: place.timezone,
      dateStyle: "full",
      timeStyle: "long",
    }).format(now);

  return {
    location: `${place.name}, ${place.country}`,
    timezone: place.timezone,
    current_time: formattedTime,
  };
}

module.exports = {
  getTime,
};