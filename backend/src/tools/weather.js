async function getWeather(location) {
  if (!location || typeof location !== "string") {
    throw new Error("Location is required.");
  }

  // 1. Find the location
  const geoUrl =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(location)}` +
    `&count=1` +
    `&language=en` +
    `&format=json`;

  const geoResponse = await fetch(geoUrl);

  if (!geoResponse.ok) {
    throw new Error("Weather location search failed.");
  }

  const geoData = await geoResponse.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(
      `Could not find location: ${location}`
    );
  }

  const place = geoData.results[0];

  // 2. Get weather
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${place.latitude}` +
    `&longitude=${place.longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&timezone=auto`;

  const weatherResponse = await fetch(weatherUrl);

  if (!weatherResponse.ok) {
    throw new Error("Weather API request failed.");
  }

  const weatherData = await weatherResponse.json();

  const current = weatherData.current;

  return {
    location: `${place.name}, ${place.country}`,
    temperature: current.temperature_2m,
    feels_like: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    wind_speed: current.wind_speed_10m,
    weather_code: current.weather_code,
    timezone: weatherData.timezone,
    time: current.time,
  };
}

module.exports = {
  getWeather,
};