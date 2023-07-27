require("dotenv").config();
//importing module
const express = require("express");
// require("./config");
//for preventing cors errors
const cors = require("cors");
//importing user file
const User = require("./User");
const Product = require("./Product");
//make express in executable form
const app = express();
const PORT = process.env.PORT || 8000;
const jwt = require("jsonwebtoken");
const jwtKey = "e-comm";

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URL)
.then((e) => console.log("MongoDB Connected"));


//The express.json() function is a built-in middleware function in Express. It parses incoming requests with JSON payloads and is based on body-parser.
app.use(express.json());
app.use(cors());
 

app.post("/signup", async (req, resp) => {
  let user = new User(req.body);
  let result = await user.save();
  //convert result to object
  result = result.toObject();
  delete result.password;
  jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      resp.send({ result: "Something went wrong. Try Again !" });
    }
    resp.send({ user, auth: token });
  });
});

app.post("/login", async (req, resp) => {
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          resp.send({ result: "Something went wrong. Try Again !" });
        }
        resp.send({ user, auth: token });
      });
    } else {
      resp.send({ result: "no user found" });
    }
  } else {
    resp.send({ result: "no user found" });
  }
  //since we don't want password we are removing it. )thats why we used select("-passoword"). Minus here remove the password.
});

app.post("/add-product", verifyToken, async (req, resp) => {
  let product = new Product(req.body);
  let result = await product.save();
  resp.send(result);
});
app.get("/products", verifyToken, async (req, resp) => {
  let products = await Product.find();
  if (products.length > 0) {
    resp.send(products);
  } else {
    resp.send({ result: "No Products Found" });
  }
});

app.delete("/product/:id", verifyToken, async (req, resp) => {
  let result = await Product.deleteOne({ _id: req.params.id });
  resp.send(result);
});

app.get("/product/:id", verifyToken, async (req, resp) => {
  let result = await Product.findOne({ _id: req.params.id });
  if (result) {
    resp.send(result);
  } else {
    resp.send({ result: "No Product found" });
  }
});

app.put("/product/:id", verifyToken, async (req, resp) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  resp.send(result);
});

app.get("/search/:key", verifyToken, async (req, resp) => {
  const regex = new RegExp(req.params.key, "i");
  let result = await Product.find({
    $or: [
      {
        name: regex,
      },
      {
        company: regex,
      },
      {
        category: regex,
      },
    ],
  });
  resp.send(result);
});

function verifyToken(req, resp, next) {
  let token = req.headers["authorization"];
  if (token) {
    token = token.split(" ")[1];
    jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        resp.status(401).send({ result: "Please provide valid token" });
      } else {
        next();
      }
    });
  } else {
    resp.status(403).send({ result: "Please provide valid token" });
  }
}
app.listen(PORT);
