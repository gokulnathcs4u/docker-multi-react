const { createClient } = require("redis");
const keys = require("./keys");

const subscriber = createClient({
  socket: {
    host: keys.redisHost,
    port: keys.redisPort,
  },
});
(async () => {
  await subscriber.connect();

  await subscriber.subscribe("article", (message) => {
    console.log("Inside Subscribe");
    storeValues(message);
  });

  await subscriber.subscribe("insert", (message) => {
    console.log("Inside Subscribe insert");
    insertIndex(message);
  });
})();

function fib(number) {
  var n1 = 0;
  var n2 = 1;
  var nextTerm = 0;

  console.log("Fibonacci Series:");

  for (let i = 1; i <= number; i++) {
    nextTerm = n1 + n2;
    n1 = n2;
    n2 = nextTerm;
  }
  console.log(nextTerm);
  return nextTerm;
}

const insertIndex = async (message) => {
  const sub = subscriber.duplicate();
  await sub.connect();
  console.log("Inside insertIndex");
  console.log(message);
  try {
    sub.hSet("values1", message, fib(parseInt(message)));
  } catch (e) {
    console.log(e);
  }
};

const storeValues = async (message) => {
  const sub = subscriber.duplicate();
  await sub.connect();
  console.log("Inside storeValues");
  console.log(message);
  try {
    await sub.set("article", message);
  } catch (e) {
    console.log(e);
  }
};
