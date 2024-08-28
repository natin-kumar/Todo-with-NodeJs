const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

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

function readUser() {
  try {
    const data = fs.readFileSync("user.json", "utf-8");
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Error in reading user data: ", err);
    return [];
  }
}

function writeUser(data) {
  try {
    fs.writeFileSync("user.json", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error in writing user data: ", err);
  }
}

function readData(userId) {
  try {
    let data = [];

    try {
      data = JSON.parse(fs.readFileSync("data.json", "utf-8"));
    } catch (err) {
      if (err.code === "ENOENT" || err instanceof SyntaxError) {
        data = [];
        fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
      } else {
        throw err;
      }
    }

    let userdata = data.find((u) => u.userid === userId);

    if (!userdata) {
      userdata = { userid: userId, todoData: [] };
      data.push(userdata);
      writeData(userId, userdata.todoData, data);
    }

    return userdata.todoData;
  } catch (err) {
    console.error("Error in reading data: ", err);
    return [];
  }
}

function writeData(userId, newTodoData, data = null) {
  try {
    const existingData =
      data || JSON.parse(fs.readFileSync("data.json", "utf-8"));
    let userdata = existingData.find((u) => u.userid === userId);

    if (userdata) {
      userdata.todoData = newTodoData;
    } else {
      existingData.push({ userid: userId, todoData: newTodoData });
    }

    fs.writeFileSync("data.json", JSON.stringify(existingData, null, 2));
  } catch (err) {
    console.error("Error in writing data: ", err);
  }
}

function loadData(task, id, userId, checkbox = false) {
  const savedData = readData(userId);
  const obj = { task, TaskId: id, check: checkbox };
  savedData.push(obj);
  writeData(userId, savedData);
}

function updateData(id, userId) {
  let data = readData(userId);
  let newData = data.filter((ele) => ele.TaskId != id);
  console.log(newData);
  writeData(userId, newData);
}

function updateNewData(data, userId) {
  const prevData = readData(userId);
  prevData.forEach((ele) => {
    if (ele.TaskId === data.id) {
      ele.task = data.input;
    }
  });
  writeData(userId, prevData);
}

function checkBool(data, userId) {
  const jsonData = readData(userId);
  jsonData.forEach((ele) => {
    if (ele.TaskId === data.DivId) {
      ele.check = data.check;
    }
  });
  writeData(userId, jsonData);
}

app.get("/", (req, res) => {
  res.redirect("/loginUser");
});

app.get("/todo", (req, res) => {
  const userId = req.cookies.userId;
  if (userId) {
    res.render('todo');
  } else {
    res.redirect("/loginUser");
  }
});

app.get("/signup", (req, res) => {
  res.render('signup');
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
  res.render('otp');
});

let otpGlobal, userglobal, mailGlobal, passGlobal;

app.post("/signup", async (req, res) => {
  const { user, mail, pass } = req.body;
  const data = readUser(); 

  if (data.find((u) => u.mail === mail)) {
    return res.status(200).json({ message: "User already exists." });
  }

  try {
    const otp = await sendmail(mail);
    req.session.otp = otp;
    req.session.mail = mail;
    req.session.user = user; 
    req.session.pass = pass; 
    res.status(200).json({ message: "Signup successful, please verify OTP." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ message: "Error sending OTP." });
  }
});
app.get('/resend',async(req,res)=>{
  try {
    const otp=await sendmail(req.session.mail);
    req.session.otp = otp;
    res.status(200).json({message: "Otp resent Successfully"})
  } catch (error) {
    console.error("Error resending OTP:", error);
    return res.status(500).json({ message: "Error resending OTP." });
  }
  
})

app.post("/verifyOTP", async (req, res) => {
  const { otp } = req.body;
  const storedOtp = req.session.otp;
   console.log(storedOtp)
  if (parseInt(otp) !== storedOtp) {
    return res.status(400).json({ message: "OTP not matched!" });
  }

  try {
    const hashedPassword = await bcrypt.hash(req.session.pass, 10);
    const newUser = {
      user: req.session.user,
      mail: req.session.mail,
      pass: hashedPassword,
    };

    const data = readUser();
    data.push(newUser);
    writeUser(data);

    // Clear session variables after successful registration
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

app.get("/loadData", (req, res) => {
  const data = readData(req.cookies.userId);
  res.status(200).json(data);
});

app.get("/loginUser", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/todo");
  }
  res.render('login');
});

app.post("/loginUser", async (req, res) => {
  const { user, pass } = req.body;
  const userdata = readUser();
  const realUser = userdata.find((u) => u.user === user);

  if (!realUser) {
    return res
      .status(200)
      .json({ message: "User not found. Please sign up first." });
  }

  try {
    const match = await bcrypt.compare(pass, realUser.pass);
    if (match) {
      req.session.userId = user;
      res.cookie("userId", user, { maxAge: 1200000, httpOnly: true });
      return res.status(200).json({ message: "Login successful" });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/editable", (req, res) => {
  updateNewData(req.body, req.cookies.userId);
  res.json(req.body);
});

app.delete("/deleteData", (req, res) => {
  const id = req.body.DivId;
  updateData(id, req.cookies.userId);
  res.send(id);
});

app.post("/movement", (req, res) => {
  checkBool(req.body, req.cookies.userId);
  res.send(req.body);
});

app.post("/todo", (req, res) => {
  const { task } = req.body;
  loadData(task, Date.now(), req.cookies.userId);
  res.send(req.body);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
