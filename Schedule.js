const cron = require('node-cron');
const { client } = require('./connectDB');
const { sendMessage } = require('./TWILIO');


cron.schedule('0 6 * * *', async () => {
  console.log("🕐 Running 1:08 PM reminder check...");

  try {
    const { rows } = await client.query(`
      SELECT 
        p.id AS plant_id,
        p.name AS plant_name,
        u.phone,
        u.id,
        MAX(s.scheduled_date) AS last_schedule_date
      FROM plants p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN schedules s ON s.plant_id = p.id
      GROUP BY p.id, p.name, u.phone,u.id
      HAVING MAX(s.scheduled_date) < CURRENT_DATE OR MAX(s.scheduled_date) IS NULL
    `);

    for (const { id,phone, plant_name } of rows) {
      const formattedPhone = `+91${phone}`;
      const message = `📷 Reminder: Please upload a photo of your plant "${plant_name}" today. It hasn’t been scheduled recently.`;

      sendMessage(formattedPhone, message);
      console.log(`✅ Sent reminder for ${plant_name} to ${formattedPhone}`);
      await client.query('insert into notifications (user_id,message) values ($1,$2)',[id,message]);
    }

  } catch (err) {
    console.error("❌ Error in cron job:", err);
  }
});
