const express = require('express')
const app = express()
const cors = require("cors")
const dotenv = require("dotenv");
dotenv.config();
const port = process.env.PORT || 5000;



// middleware
app.use(express.json())
app.use(cors())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rrkijcq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
    const CollectionFMenu = client.db("BistroBossDB").collection('OrderDB')
    const CollectionFReview = client.db("BistroBossReviewDB").collection('ReviewDB')
    const CollectionFCarts = client.db("BistroBossReviewDB").collection('CartsDB')
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    app.get('/menu', async(req, res) => {
        const menu = req.body
        const result = await CollectionFMenu.find(menu).toArray()
        res.send(result)
      })


    app.get('/review', async(req, res) => {
        const review = req.body
        const result = await CollectionFReview.find(review).toArray()
        res.send(result)
      })

      // cart related api
      app.get('/carts', async(req,res)=>{
        const email =  req.query.email
        const filter = {email: email}
        const result = await CollectionFCarts.find(filter).toArray()
        res.send(result)
      })


      app.post('/carts', async(req,res)=>{
        const cart = req.body;
        const result = await CollectionFCarts.insertOne(cart)
        res.send(result)

      })

      app.delete('/carts/:id', async(req,res)=>{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const result = await CollectionFCarts.deleteOne(filter)
        res.send(result)
      })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('server is connection...!')
  })
  
  app.listen(port, () => {
    console.log(`Example app listening on port, ${port}`)
  })