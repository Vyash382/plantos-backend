const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");
const { get5DayForecast } = require("./Weather.js");
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEN_KEY,
});

function parseSchedule(rawString) {
  const tasks = rawString
    .split("--")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return tasks.map((taskEntry) => {
    const [datetime, task] = taskEntry.split("->");
    const [datePart, timePart] = datetime.trim().split(" ");
    const [year, month, day] = datePart.split("-");
    const formattedDate = `${year}-${month}-${day}`;
    return {
      date: formattedDate,
      time: timePart,
      task: task.trim(),
    };
  });
}

async function gemini(species, disease, city) {
  const weather = await get5DayForecast(city);
  const stringgg = JSON.stringify(weather);

  console.log("Weather string:", stringgg);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `plant:${species} disease:${disease}, create a 3 day care schedule with date and time for it.Like "2025-07-12 15:00->Water the plant -- 2025-06-22 17:00->fertilize the plant -- ..." in this format. Each care task should be not more than 30 words. Do not add unnecessary headings or footings. Consider 3 day weather also ${stringgg}`,
          },
        ],
      },
    ],
  });

  // extract the generated text correctly
  const text = response.candidates[0].content.parts[0].text;

  console.log("Gemini text:", text);

  const answer = parseSchedule(text);
  return answer;
}

module.exports = { gemini };
