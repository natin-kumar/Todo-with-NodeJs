const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { UserTodo, UserData } = require("./models/data");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: "my_secret_key",
    resave: true,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const mongoose = require("mongoose");
mongoose
  .connect("mongodb://localhost:27017/expressTodo")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

async function readData(user) {
  try {
    const data = await UserTodo.findOne({ userid: user });
    if (data) {
      return data.todoData;
    } else {
      return [];
    }
  } catch (err) {
    console.log("Error in reading user from UserTodo: ", err);
  }
}

async function writeData(user, newTodoData) {
  // console.log(newTodoData);
  try {
    const userTodo = await UserTodo.findOne({ userid: user });
    if (userTodo) {
      userTodo.todoData = newTodoData;
      await userTodo.save();
    } else {
      console.log(`User with userid ${user} not found.`);
    }
  } catch (err) {
    console.log("Error in writing todo data:", err);
  }
}

async function loadData(task, id, userId, checkbox = false) {
  const savedData = await readData(userId);
  const obj = { task, TaskId: id, check: checkbox };
  savedData.push(obj);
  await writeData(userId, savedData);
}

async function deleteData(id, userId) {
  const data = await readData(userId);
  const newData = data.filter((ele) => ele.TaskId != id);
  await writeData(userId, newData);
}

async function updateNewData(data, userId) {
  const prevData = await readData(userId);
  prevData.forEach((ele) => {
    if (ele.TaskId == data.id) {
      console.log("matched!");
      ele.task = data.input;
    }
  });
  await writeData(userId, prevData);
}

async function checkBool(data, userId) {
  const jsonData = await readData(userId);

  jsonData.forEach((ele) => {
    if (ele.TaskId == data.DivId) {
      ele.check = data.check;
    }
  });
  await writeData(userId, jsonData);
}

app.get("/", (req, res) => {
  res.redirect("/loginUser");
});

app.get("/todo", (req, res) => {
  const userId = req.cookies.userId;
  if (userId) {
    res.sendFile(path.join(__dirname, "public", "todo.html"));
  } else {
    res.redirect("/loginUser");
  }
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

async function sendmail(mail) {
  const generateOtp = Math.floor(1000 + Math.random() * 9000);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "natinkumar1161@gmail.com", 
      pass: "ihjvdsrhsugfibmc", 
    },
  });
  try {
    await transporter.sendMail({
      from: "natinkumar1161@gmail.com",
      to: mail,
      subject: "OTP verification",
      text: `Thank you for signing up! This is your ${generateOtp} OTP. Please don't share it with anyone.`,
    });
    console.log("Email sent successfully");
    return generateOtp;
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
}

app.get("/verifyOTP", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "otp.html"));
});

app.post("/signup", async (req, res) => {
  const { user, mail, pass } = req.body;

  try {
    const existingUser = await UserData.findOne({ email: mail });
    if (existingUser) {
      return res.status(200).json({ message: "User already exists." });
    }

    const otp = await sendmail(mail);
    req.session.otp = otp;
    req.session.mail = mail;
    req.session.user = user;
    req.session.pass = pass;

    res.status(200).json({ message: "Signup successful, please verify OTP." });
  } catch (error) {
    console.error("Error during signup process:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/resend", async (req, res) => {
  try {
    const otp = await sendmail(req.session.mail);
    req.session.otp = otp;
    res.status(200).json({ message: "OTP resent successfully." });
  } catch (error) {
    console.error("Error resending OTP:", error);
    return res.status(500).json({ message: "Error resending OTP." });
  }
});

app.post("/verifyOTP", async (req, res) => {
  const { otp } = req.body;
  const storedOtp = req.session.otp;
  if (parseInt(otp) !== storedOtp) {
    return res.status(400).json({ message: "OTP not matched!" });
  }

  try {
    const hashedPassword = await bcrypt.hash(req.session.pass, 10);
    const newUser = new UserData({
      name: req.session.user,
      email: req.session.mail,
      password: hashedPassword,
    });
    await newUser.save();

    const todo = new UserTodo({
      userid: req.session.user,
    });
    await todo.save();

    req.session.otp = null;
    req.session.user = null;
    req.session.mail = null;
    req.session.pass = null;

    return res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Error registering user." });
  }
});

app.get("/loadData", async (req, res) => {
  const data = await readData(req.cookies.userId);
  res.status(200).json(data);
});

app.get("/loginUser", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/todo");
  }
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/loginUser", async (req, res) => {
  const { user, pass } = req.body;
  try {
    const userdata = await UserData.findOne({ name: user });
    if (!userdata) {
      return res
        .status(200)
        .json({ message: "User not found. Please sign up first." });
    }
    const match = await bcrypt.compare(pass, userdata.password);
    if (match) {
      req.session.userId = user;
      res.cookie("userId", user, { maxAge: 120000, httpOnly: true });
      return res.status(200).json({ message: "Login successful." });
    } else {
      return res.status(401).json({ message: "Invalid credentials." });
    }
  } catch (error) {
    console.error("Error during login process:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/editable", async (req, res) => {
  console.log(req.body);
  await updateNewData(req.body, req.cookies.userId);
  res.json(req.body);
});

app.delete("/deleteData", async (req, res) => {
  const id = req.body.DivId;
  await deleteData(id, req.cookies.userId);
  res.send(id);
});

app.post("/movement", async (req, res) => {
  console.log("body: ",req.body);
  await checkBool(req.body, req.cookies.userId);
  res.send(req.body);
});

app.post("/todo", async (req, res) => {
  const { task } = req.body;
  await loadData(task, Date.now(), req.cookies.userId);
  res.status(200).send(req.body);
});

app.listen(3007, () => {
  console.log("Server is running on port 3007");
});
