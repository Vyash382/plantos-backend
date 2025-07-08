const axios = require('axios');
require('dotenv').config();

async function get5DayForecast(city) {
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=3`;

  try {
    const response = await axios.get(url);
    return response.data.forecast.forecastday.map((day) => ({
      date: day.date,
      max_temp: day.day.maxtemp_c,
      min_temp: day.day.mintemp_c,
      condition: day.day.condition.text,
    }));
  } catch (err) {
    console.error('Weather API error:', err.response?.data || err.message);
    throw new Error('Weather fetch failed');
  }
}

module.exports={get5DayForecast};
