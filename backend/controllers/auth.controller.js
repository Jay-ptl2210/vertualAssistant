import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import genToken from '../config/token.js';

// 🔐 In-memory OTP store (use Redis or DB in production)
const otpStore = new Map();

/* ------------------------ Helper: Send OTP via Email ------------------------ */
const sendOTP = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'jaypatel22102004@gmail.com',      // 🔁 Your Gmail
      pass: 'azlb ykbv aevg ugud',         // 🔁 App password from Google
    },
  });

  const mailOptions = {
    from: 'Virtual Assistant <your_email@gmail.com>',
    to: email,
    subject: 'Your OTP for Registration',
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};

/* ---------------------------- 1. Send OTP Route ---------------------------- */
export const sendOtp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await sendOTP(email, otp);

    otpStore.set(email, {
      name,
      hashedPassword,
      otp,
      createdAt: Date.now()
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

/* --------------------------- 2. Verify OTP Route --------------------------- */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("📨 Email received:", email);
    console.log("🔢 OTP received from frontend:", `"${otp}"`);

    const data = otpStore.get(email);
    console.log("🧠 OTP data in server memory:", data);

    if (!data)
      return res.status(400).json({ message: "OTP not found or expired" });

    if (Date.now() - data.createdAt > 5 * 60 * 1000) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP expired" });
    }

    console.log("✅ Comparing:", `"${String(data.otp).trim()}" === "${String(otp).trim()}"`);

    if (String(data.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.create({
      name: data.name,
      email,
      password: data.hashedPassword
    });

    otpStore.delete(email);

    const token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: false,
    });

    res.status(201).json({ message: "Registration successful", user });

  } catch (error) {
    console.error("🚨 OTP verification failed:", error);
    res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};
/* ------------------------------ 3. Login Route ------------------------------ */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Email not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid password" });

    const token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "None",
      secure: true,
    });

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

/* ------------------------------ 4. Logout Route ------------------------------ */
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};
