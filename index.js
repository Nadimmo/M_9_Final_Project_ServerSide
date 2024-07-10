const express = require("express");
const app = express();
var jwt = require("jsonwebtoken");
const cors = require("cors");
const stripe = require("stripe")(
  "sk_test_51PZmx2Ro2enkpQYdV1PdzTYYwEUam2XGqbWAnEE7CMUqysztVSfp9NBAoOfzNY5yEx1M04oMWAV5Q0THnhvi1M6500w8osQPgZ"
);
const dotenv = require("dotenv");
dotenv.config();
const port = process.env.PORT || 5000;

// ........middleware..........
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rrkijcq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const CollectionFMenu = client.db("BistroBossDB").collection("OrderDB");
  const CollectionFReview = client
    .db("BistroBossReviewDB")
    .collection("ReviewDB");
  const CollectionFCarts = client
    .db("BistroBossReviewDB")
    .collection("CartsDB");
  const CollectionFUsers = client
    .db("BistroBossReviewDB")
    .collection("UsersDB");
  const CollectionFPayments = client
    .db("BistroBossReviewDB")
    .collection("PaymentsDB");
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // .........jwt related api ................
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log();
      const token = jwt.sign(user, process.env.ACCESS_TOK, { expiresIn: "1h" });
      res.send({ token });
    });

    // ......jwt verify..........
    // middlewares
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOK, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await CollectionFUsers.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // ...............menu related api...............
    app.get("/menu", async (req, res) => {
      const menu = req.body;
      const result = await CollectionFMenu.find(menu).toArray();
      res.send(result);
    });

    app.get("/menu/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await CollectionFMenu.findOne(query);
      res.send(result);
    });

    app.post("/menu", verifyToken, verifyAdmin, async (req, res) => {
      const item = req.body;
      const result = await CollectionFMenu.insertOne(item);
      res.send(result);
    });

    app.delete("/menu/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filterId = { _id: new ObjectId(id) };
      const result = await CollectionFMenu.deleteOne(filterId);
      res.send(result);
    });

    app.patch("/menu/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: item.name,
          category: item.category,
          price: item.price,
          recipe: item.recipe,
          image: item.image,
        },
      };
      const result = await CollectionFMenu.updateOne(filter, updateDoc);
      res.send(result);
    });

    // ............review related api ...............
    app.get("/review", async (req, res) => {
      const review = req.body;
      const result = await CollectionFReview.find(review).toArray();
      res.send(result);
    });

    // ............cart related api..........
    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = await CollectionFCarts.find(filter).toArray();
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const cart = req.body;
      const result = await CollectionFCarts.insertOne(cart);
      res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await CollectionFCarts.deleteOne(filter);
      res.send(result);
    });

    //.............. user related api...........
    app.post("/user", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const exiting = await CollectionFUsers.findOne(filter);
      if (exiting) {
        return res.send({ message: "user already exit" });
      }

      const result = await CollectionFUsers.insertOne(user);
      res.send(result);
    });

    app.get("/user", verifyToken, verifyAdmin, async (req, res) => {
      const user = await CollectionFUsers.find().toArray();
      res.send(user);
    });

    app.delete("/user/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await CollectionFUsers.deleteOne(filter);
      res.send(result);
    });

    // .............admin related api...........
    app.patch("/user/admin/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await CollectionFUsers.updateOne(filter, updateDoc);
      res.send(result);
    });

    // ..............check admin...........
    app.get("/user/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const user = await CollectionFUsers.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    // ............payment intents related api....................

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log("amount", amount);
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({ clientSecret: paymentIntent.client_secret });
    });

    // .........payment related api...........
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const paymentResult = await CollectionFPayments.insertOne(payment);
      console.log("payment info", paymentResult);

      // find id
      const query = {
        _id: {
          $in: payment.cartIds.map((id) => new ObjectId(id)),
        },
      };

      const result = await CollectionFCarts.deleteMany(query);
      res.send({ paymentResult, result });
    });

    app.get('/payments/:email', verifyToken, async(req,res)=>{
      const query = {email: req.params.email}
      if(req.params.email !== req.decoded.email){
        res.status(403).send({message: "forbidden access"})
      }

      const result = await CollectionFPayments.find(query).toArray()
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is connection...!");
});

app.listen(port, () => {
  console.log(`Example app listening on port, ${port}`);
});
