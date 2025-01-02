const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f7tqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const assignmentCollection = client.db('assignmentHub').collection('assignment');

    const submittedAssignmentCollection = client.db('assignmentHub').collection('submitted');


    // assignment search 
    app.get('/filter', async (req, res) => {
      let query = {};
      const difficulty = req.query.difficulty;
      if(difficulty){
        query = { difficulty: difficulty }
      }
      if(difficulty === 'all') {
        query = {};
      }
      const result = await assignmentCollection.find(query).toArray();
      res.send(result);
    })

    // createAssignment
    app.get('/assignments', async (req, res) => {
      const cursor = assignmentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/assignments/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(query);
      res.send(result);
    });

    app.put('/update/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const update = req.body;
      const updatedInfo = {
        $set: {
          title: update?.title,
          description: update?.description,
          imgUrl: update?.imgUrl,
          marks: update?.marks,
          difficulty: update?.difficulty,
          dueDate: update?.dueDate
        }
      }
      const result = await assignmentCollection.updateOne(filter, updatedInfo, option);
      res.send(result);
    })

    app.post('/createAssignment', async (req, res) => {
      const query = req.body;
      const result = await assignmentCollection.insertOne(query);
      res.send(result);
    });

    app.delete('/assignments/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.deleteOne(query);
      res.send(result);
    });


    // submittedAssignment

    app.get('/mySubmission', async (req, res) => {
      const email = req?.query?.email;
      const query = { email: email };
      const result = await submittedAssignmentCollection.find(query).toArray();
      for (const participant of result) {
        const query1 = { _id: new ObjectId(participant.assignmentId) };
        const result1 = await assignmentCollection.findOne(query1);
        if (result1) {
          participant.title = result1?.title;
          participant.status = participant?.status;
          participant.marks = result1?.marks;
          participant.obtainMarks = participant?.obtainMarks;
          participant.feedback = participant?.feedback;
          participant.imgUrl = result1?.imgUrl
        }
      }
      res.send(result)
    });

    app.get('/pending', async (req, res) => {
      const email = req?.query?.email;
      const query = {
        status: 'Pending',
        email: email
      };
      const result = await submittedAssignmentCollection.find(query).toArray();
      for (const participant of result) {
        const query1 = { _id: new ObjectId(participant.assignmentId) };
        const result1 = await assignmentCollection.findOne(query1);
        if (result1) {
          participant.title = result1?.title;
          participant.status = participant?.status;
          participant.marks = result1?.marks;
          participant.obtainMarks = participant?.obtainMarks;
          participant.feedback = participant?.feedback;
          participant.imgUrl = result1?.imgUrl
        }
      }
      res.send(result);
    });

    app.get('/pending/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await submittedAssignmentCollection.findOne(query);
      res.send(result);
    })

    app.patch('/giveMark/:id', async (req, res) => {
      const id = req.params.id;
      const update = req.body;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const giveMark = {
        $set: {
          status: update.status,
          obtainMarks: update.obtainMarks,
          feedback: update.feedback
        }
      };
      const result = await submittedAssignmentCollection.updateOne(filter, giveMark, option);
      res.send(result);
    })

    app.post('/submittedAssignment', async (req, res) => {
      const query = req.body;
      const result = await submittedAssignmentCollection.insertOne(query);
      res.send(result);
    })


  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('PeerLearn Server is running');
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
})