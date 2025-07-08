const express = require("express");
const plantRouter = express.Router();
const { client } = require("../connectDB.js");
const { sendMessage } = require("../TWILIO.js");
const { multerUpload } = require("../utils/Cloudinary.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { verifyJWT } = require("../utils/VerifyJWT.js");
const { gemini } = require("../utils/GeminiAPI.js");
require("dotenv").config();

plantRouter.post(
  "/predict-plant",
  multerUpload.array("photos", 5),
  verifyJWT,
  async (req, res) => {
    try {
      console.log("Received request to /predict-plant");
      console.log("req.body:", req.body);

      const urls = req.files.map((file) => file.path);
      console.log("Uploaded image URLs:", urls);

      if (urls.length === 0) {
        console.log("No files uploaded");
        return res.status(400).json({ error: "No files uploaded." });
      }

      console.log("Sending images to FastAPI model...");
      const response = await fetch("https://plantos-dl-model.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      console.log("FastAPI response status:", response.status);
      if (!response.ok) {
        throw new Error(`FastAPI returned ${response.status}`);
      }

      const prediction = await response.json();
      console.log("Prediction from FastAPI:", prediction);

      console.log("Generating care schedule from Gemini...");
      const schedule = await gemini(prediction.species, prediction.disease, req.body.location);
      console.log("Generated schedule:", schedule);

      console.log("Inserting plant data into plants table...");
      const plantInsert = await client.query(
        "insert into plants (name, species, status, location, user_id) values ($1,$2,$3,$4,$5) returning id",
        [
          req.body.name,
          prediction.species,
          prediction.disease,
          req.body.location,
          req.user.id,
        ]
      );
      const plant_id = plantInsert.rows[0].id;
      console.log("Inserted plant with id:", plant_id);

      console.log("Inserting images into media table...");
      for (const url of urls) {
        console.log(`Inserting media for plant_id ${plant_id} url: ${url}`);
        await client.query("insert into media (plant_id, url) values ($1, $2)", [
          plant_id,
          url,
        ]);
      }

      console.log("Inserting schedule into schedule table...");
      for (const taskObj of schedule) {
        console.log(`Inserting schedule: ${taskObj.date} ${taskObj.time} - ${taskObj.task}`);
        await client.query(
          "insert into schedules (plant_id, task, scheduled_date, scheduled_time, status) values ($1,$2,$3,$4,$5)",
          [
            plant_id,
            taskObj.task,
            taskObj.date,
            taskObj.time,
            "pending",
          ]
        );
      }

      console.log("All data inserted successfully.");
      return res.json({prediction:{species:prediction.species,disease:prediction.disease}});
    } catch (err) {
      console.error("Error in /predict-plant:", err);
      return res.status(500).json({ error: err.message || "Something went wrong" });
    }
  }
);
plantRouter.post('/get-garden',verifyJWT,async(req,res)=>{
  const response = await client.query(`SELECT 
    p.id,
    p.status,
    p.name,
    p.species,
    m.url
FROM 
    plants p
JOIN (
    SELECT 
        plant_id,
        url
    FROM 
        media m1
    WHERE 
        uploaded_at = (
            SELECT MAX(uploaded_at)
            FROM media m2
            WHERE m2.plant_id = m1.plant_id
        )
) m ON p.id = m.plant_id
WHERE 
    p.user_id = $1;`,[req.user.id]);
    res.status(200).json({rows:response.rows});
})
plantRouter.post('/get-plant',async(req,res)=>{
  const {id} = req.body;
  const response1 = await client.query(`SELECT name, species, location, status FROM plants WHERE id = $1;`,[id]);
  const response2 = await client.query(`SELECT task FROM schedules WHERE plant_id = $1 AND scheduled_date = CURRENT_DATE;`,[id]);
  const response3 = await client.query(`SELECT url, uploaded_at FROM media WHERE plant_id = $1 ORDER BY uploaded_at DESC; `,[id]);
  res.status(200).json({plant_specs:response1.rows,tasks:response2.rows,media:response3.rows});
})
plantRouter.post('/toggle',verifyJWT,async(req,res)=>{
  const {id,status} = req.body;
  const response = await client.query('update schedules set status = $2 where id = $1',[id,status]);
  res.status(200).json({response});
})
plantRouter.post(
  "/predict-status",
  multerUpload.array("photos", 5),
  verifyJWT,
  async (req, res) => {
    const {plant_id} = req.body;
    console.log("Received request to /predict-plant");
      console.log("req.body:", req.body);

      const urls = req.files.map((file) => file.path);
      console.log("Uploaded image URLs:", urls);

      if (urls.length === 0) {
        console.log("No files uploaded");
        return res.status(400).json({ error: "No files uploaded." });
      }

      console.log("Sending images to FastAPI model...");
      const response = await fetch("https://plantos-dl-model.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      console.log("FastAPI response status:", response.status);
      if (!response.ok) {
        throw new Error(`FastAPI returned ${response.status}`);
      }

      const prediction = await response.json();
      console.log("Prediction from FastAPI:", prediction);

      console.log("Generating care schedule from Gemini...");
      const schedule = await gemini(prediction.species, prediction.disease, req.body.location);
      console.log("Generated schedule:", schedule);
      console.log("Inserted plant with id:", plant_id);
  
      console.log("Inserting images into media table...");
      for (const url of urls) {
        console.log(`Inserting media for plant_id ${plant_id} url: ${url}`);
        await client.query("insert into media (plant_id, url) values ($1, $2)", [
          plant_id,
          url,
        ]);
      }

      console.log("Inserting schedule into schedule table...");
      for (const taskObj of schedule) {
        console.log(`Inserting schedule: ${taskObj.date} ${taskObj.time} - ${taskObj.task}`);
        await client.query(
          "insert into schedules (plant_id, task, scheduled_date, scheduled_time, status) values ($1,$2,$3,$4,$5)",
          [
            plant_id,
            taskObj.task,
            taskObj.date,
            taskObj.time,
            "pending",
          ]
        );
      }
      await client.query('update plants set status=$1 where id = $2',[prediction.disease,plant_id]);
      console.log("All data inserted successfully.");
      return res.json({success:true});
    
  }
);
module.exports = { plantRouter };
