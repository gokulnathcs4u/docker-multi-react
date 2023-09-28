const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createClient } = require("redis");
const keys = require("./keys");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require("pg");
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error(err));
});

const publisher = createClient({
  socket: {
    host: keys.redisHost,
    port: keys.redisPort,
  },
});

(async () => {
  const article = {
    id: "123456",
    name: "Using Redis Pub/Sub with Node.js",
    blog: "Logrocket Blog",
  };
  await publisher.connect();
  await publisher.publish("article", JSON.stringify(article));
})();

app.get("/", async (req, res) => {
  console.log("inside get/");
  const response = await publisher.get("article");
  res.json(response);
});

app.post("/values", async (req, res) => {
  console.log("inside post/");
  const index = req.body.index;

  console.log("request is " + index);

  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  await publisher.publish("insert", JSON.stringify(index));
  await pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);

  res.send({ working: true });
});

app.get("/values/current", async (req, res) => {
  console.log("inside current/");
  const sub = publisher.duplicate();
  await sub.connect();
  try {
    const values = await sub.hGetAll("values1");
    res.json(values);
  } catch (e) {
    res.json(e);
  }
});

app.get("/values/all", async (req, res) => {
  const values = await pgClient.query("SELECT * from values");
  res.send(values.rows);
});

const port = 3001;
app.listen(port, () => {
  console.log(`Now listening on port ${port}`);
});
