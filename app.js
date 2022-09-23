const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

// Initializing database and server using node js

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// creating status property for response

const statusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

// creating priority property for response

const priorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

// creating status and priority for response

const statusAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

// API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { status, priority, search_q = "" } = request.query;

  // using switch case

  switch (true) {
    case statusProperty(request.query):
      getTodosQuery = `
            SELECT
              *
            FROM 
              todo
            WHERE
              todo LIKE '%${search_q}%' AND status = '${status}';`;
      break;
    case priorityProperty(request.query):
      getTodosQuery = `
            SELECT
              *
            FROM
              todo
            WHERE 
              todo LIKE '%${search_q}%' AND priority = '${priority}';`;
      break;
    case statusAndPriorityProperty(request.query):
      getTodosQuery = `
            SELECT
              *
            FROM
              todo
            WHERE
              todo LIKE '%${search_q}%' AND status = '${status}' AND priority = '${priority}';`;
      break;
    default:
      getTodosQuery = `
            SELECT
              * 
            FROM
              todo
            WHERE
              todo LIKE '%${search_q}%';`;
      break;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

// API 2  Returns a specific todo based on the todo ID using GET Method

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = '${todoId}';`;
  const getTodo = await db.get(getTodoQuery);
  response.send(getTodo);
});

// API 3 Create a todo in the todo table, Using POST Method

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
    INSERT INTO
      todo (id, todo, priority, status)
    VALUES
      (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4 Updates the details of a specific todo based on the todo ID using PUT method

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET 
      todo = '${todo}', 
      priority = '${priority}', 
      status = '${status}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API 5 Deletes a todo from the todo table based on the todo ID using DELETE method

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
