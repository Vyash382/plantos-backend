const express = require('express');
const userRouter = express.Router();
const { client } = require('../connectDB.js');
const {sendMessage} = require('../TWILIO.js');
const {multerUpload} = require('../utils/Cloudinary.js')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const { verifyJWT } = require('../utils/VerifyJWT.js');
require('dotenv').config();
let saltRounds = 10;
userRouter.post('/send-otp', async (req, res) => {
    console.log('oup');
  try {
    let { email,username,phone } = req.body;
    const userInDb = await client.query('select * from users where username=$1 or phone=$2',[username,phone]);
    const users = userInDb.rows;
    if(users.length!=0){
        res.status(200).json({type:false,message:"User Already Exists"});
        return;
    }
    if (!phone) {
      return res.status(400).json({ error: 'phone is required' });
    }
    phone = '+91' + String(phone);

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);
    const check = await client.query(
      'SELECT id FROM otp_codes WHERE phone = $1',
      [phone]
    );

    if (check.rowCount > 0) {
      await client.query(
        'UPDATE otp_codes SET otp = $1, expires_at = $2 WHERE phone = $3',
        [otp, expires_at, phone]
      );
    } else {
      await client.query(
        'INSERT INTO otp_codes (phone, otp, expires_at) VALUES ($1, $2, $3)',
        [phone, otp, expires_at]
      );
    }

    
    sendMessage(phone, `Your OTP is ${otp}`);

    res.json({type:true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


userRouter.post('/verify-otp', async (req, res) => {
  try {
    let { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'phone and otp are required' });
    }

    phone = '+91' + String(phone);

    const result = await client.query(
      'SELECT * FROM otp_codes WHERE phone = $1 AND otp = $2',
      [phone, otp]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ flag:false,error: 'Invalid OTP' });
    }

    const otpRecord = result.rows[0];
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);

    if (now > expiresAt) {
      return res.status(400).json({flag:false, error: 'OTP expired' });
    }
    res.json({ flag:true });
  } catch (err) {
    console.error(err);
    res.status(500).json({flag:false, error: 'Internal server error' });
  }
});
userRouter.post('/register',multerUpload.single('file'),async(req,res)=>{
    console.log('uooooooooo');
    if (!req.file) {
        console.log('file error');
        return res.status(200).json({ type:false,message:"Give full details1"});
    }
    const fileUrl = req.file.path;
    const {name,username,password,phone} = req.body;
    if((!name) || (!username) || (!password) || (!phone)){
        console.log('val error');
        return res.status(200).json({ type:false,message:"Give full details2"});
    }
    
    const hashedPassword = await bcrypt.hash(password,saltRounds);
    
        const response =await client.query('insert into users (name,username,password_hash,avatar,phone) values ($1,$2,$3,$4,$5)',[name,username,hashedPassword,fileUrl,phone]);
        console.log(response);
    res.status(200).json({type:true,message:"Account Created Successfully"});
})
userRouter.post('/login',async (req,res)=>{
    const {username,password} = req.body;
    if((!username) || (!password)){
        res.status(200).json({type:false,message:"Wrong Credentials"});
        return;
    }
    const userInDb = await client.query('select * from users where username=$1',[username]);
    const users = userInDb.rows;
    if(users.length==0){
        res.status(200).json({type:false,message:"Wrong Credentials"});
        return;
    }
    const hashedPassword = users[0].password_hash;
    const id = users[0].id;
    const isMatch = await bcrypt.compare(password,hashedPassword);
    if (!isMatch) {
        res.status(200).json({type:false,message:"Wrong Credentials"});
        return;
    } 
    const token = jwt.sign(
            {id,username}, 
            process.env.JWT_SECRET,                
            { expiresIn: '1h' }                   
        );
    res.status(200).json({type:true,token});
})
userRouter.post('/getDetails',verifyJWT,(req,res)=>{
    res.status(200).json({type:true,user:req.user});
})
userRouter.post('/get_today_schedule',verifyJWT,async(req,res)=>{
  const response = await client.query(`SELECT 
  s.id AS id,
  s.task,
  s.status,
  s.scheduled_time,
  p.name AS plant_name
FROM 
  schedules s
JOIN 
  plants p ON s.plant_id = p.id
WHERE 
  p.user_id = $1
  AND s.scheduled_date = CURRENT_DATE
ORDER BY 
  s.scheduled_time;
`,[req.user.id]);
  res.status(200).json({tasks:response.rows});
})
userRouter.post('/my-profile',verifyJWT,async(req,res)=>{
  const response = await client.query('select name,username,phone,avatar from users where id = $1',[req.user.id]);
  console.log(response.rows[0].row);
  res.status(200).json({profile:{
    name:response.rows[0].name,
    username:response.rows[0].username,
    avatar:response.rows[0].avatar,
    phone:response.rows[0].phone
  }});
})
userRouter.post('/notification',verifyJWT,async(req,res)=>{

  const response = await client.query('select message from notifications where user_id=$1',[req.user.id]);
  res.status(200).json({messages:response.rows});
})
module.exports = userRouter;