const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
app.use(express.json());
const convertToCamelCase = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at : 3000");
    });
  } catch (e) {
    console.log(`Database Error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

//API 1
app.get("/todos/", async (request, response) => {
  let query = `SELECT * FROM todo`;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery =
            query +
            ` WHERE 
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND priority='${priority}'`;
          const data = await db.all(getTodosQuery);
          const formattedData = data.map((eachData) =>
            convertToCamelCase(eachData)
          );
          response.send(formattedData);
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasPriorityAndCategoryProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          category === "HOME" ||
          category === "LEARNING" ||
          category === "WORK"
        ) {
          getTodosQuery =
            query +
            ` WHERE 
                priority='${priority}' 
                AND category='${category}'`;
          const data = await db.all(getTodosQuery);
          const formattedData = data.map((eachData) =>
            convertToCamelCase(eachData)
          );
          response.send(formattedData);
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = query + ` WHERE status='${status}'`;
        const data = await db.all(getTodosQuery);
        const formattedData = data.map((eachData) =>
          convertToCamelCase(eachData)
        );
        response.send(formattedData);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = query + ` WHERE priority='${priority}'`;
        const data = await db.all(getTodosQuery);
        const formattedData = data.map((eachData) =>
          convertToCamelCase(eachData)
        );
        response.send(formattedData);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasCategory(request.query):
      if (
        category === "HOME" ||
        category === "LEARNING" ||
        category === "WORK"
      ) {
        getTodosQuery = query + ` WHERE category='${category}'`;
        const data = await db.all(getTodosQuery);
        const formattedData = data.map((eachData) =>
          convertToCamelCase(eachData)
        );
        response.send(formattedData);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosQuery =
        query +
        ` WHERE
    todo LIKE '%${search_q}%';`;
      const data = await db.all(getTodosQuery);
      const formattedData = data.map((eachData) =>
        convertToCamelCase(eachData)
      );
      response.send(formattedData);
  }
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `SELECT * FROM todo WHERE id=${todoId}`;
  const data = await db.get(query);
  response.send(convertToCamelCase(data));
});

//API 3
//Path: /agenda/

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    const query = `SELECT * FROM todo WHERE due_date='${formattedDate}';`;
    const data = await db.all(query);
    response.send(data.map((eachData) => convertToCamelCase(eachData)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "HOME" ||
        category === "LEARNING" ||
        category === "WORK"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
          const query = `
      INSERT INTO todo(id, todo, priority, status, category, due_date) VALUES 
      (${id}, '${todo}', '${priority}', '${status}', '${category}', '${formattedDate}')`;

          await db.run(query);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
//Path: /todos/:todoId/
const hasTodoProperty = (requestQuery) => {
  return requestQuery.todo !== undefined;
};
app.put("/todos/:todoId", async (request, response) => {
  const { status, priority, todo, category, dueDate } = request.body;
  const { todoId } = request.params;
  let query = `UPDATE todo SET `;
  switch (true) {
    case hasPriorityProperty(request.body):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        query += `priority = '${priority}' WHERE id = ${todoId};`;
        await db.run(query);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.body):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        query += `status = '${status}' WHERE id = ${todoId};`;
        await db.run(query);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategory(request.body):
      if (
        category === "HOME" ||
        category === "LEARNING" ||
        category === "WORK"
      ) {
        query += `category = '${category}' WHERE id = ${todoId};`;
        await db.run(query);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasTodoProperty(request.body):
      query += `todo = '${todo}' WHERE id = ${todoId};`;
      await db.run(query);
      response.send("Todo Updated");
      break;
    default:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
        query += `due_date = '${formattedDate}' WHERE id = ${todoId};`;
        await db.run(query);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
  }
});

//API 6
//Path: /todos/:todoId/
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const query = `DELETE FROM todo WHERE id=${todoId}`;
  await db.run(query);
  response.send("Todo Deleted");
});

module.exports = app;
