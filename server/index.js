const express = require('express');
const server = express();
const mysql = require('mysql');
const dbcredentials = require('./_config');
server.use(express.json());

function makeQuery(sql) {
  const connection = mysql.createConnection(dbcredentials.credentials);
  connection.connect();
  const sqlPromise = new Promise((resolve, reject) => {
    connection.query(sql, (error, results) => {
      connection.end();
      if (error) { reject(error); }
      resolve(results);
    });
  });
  return sqlPromise;
}

server.get('/api/groceries', async (req, res) => {
  const sql =
    'SELECT groceryItems.id AS id, itemName, remainingAmount, unitName, locationName ' +
    'FROM groceryItems ' +
    'JOIN amountUnits ' +
      'ON amountUnitid = amountUnits.id ' +
    'JOIN storageLocations ' +
      'ON locationId = storageLocations.id';
  const results = await makeQuery(sql)
    .catch(() => res.status(500).send('An error occurred while connecting to the database'));
  res.status(200).send(results);
});

server.get('/api/groceries/:id', async (req, res) => {
  if (!req.params.id) {
    res.status(400).send('Item ID required');
  } else {
    const sql =
      'SELECT * ' +
      'FROM groceryItems ' +
      'JOIN groceryCategories ' +
        'ON categoryId = groceryCategories.id ' +
      'JOIN amountUnits ' +
        'ON amountUnitid = amountUnits.id ' +
      'JOIN storageLocations ' +
        'ON locationId = storageLocations.id ' +
      `WHERE groceryItems.id = ${mysql.escape(req.params.id)}`;
    const results = await makeQuery(sql)
      .catch(() => res.status(500).send('An error occurred while connecting to the database'));
    if (!results.length) {
      res.status(404).send(`Item with ID ${req.params.id} not found`);
    } else {
      res.status(200).send({
        'id': results[0].id,
        'name': results[0].itemName,
        'category': results[0].categoryName,
        'amount': {
          'initial': results[0].amount,
          'quantity': results[0].remainingAmount,
          'unit': results[0].unitName
        },
        'purchaseDate': results[0].purchaseDate,
        'expirationDate': results[0].expirationDate,
        'location': {
          'name': results[0].locationName,
          'description': results[0].description
        },
        'notes': results[0].notes
      });
    }
  }
});

server.get('/api/locations', async (req, res) => {
  const sql =
  'SELECT * ' +
  'FROM storageLocations';
  const results = await makeQuery(sql)
    .catch(() => res.status(500).send('An error occurred while connecting to the database'));
  res.status(200).send(results);
});

server.delete('/api/grades/:id', async (req, res) => {
  if (!req.params.id) {
    res.status(400).send('Student ID required');
  } else {
    const sql = `DELETE FROM grades WHERE id = ${mysql.escape(req.params.id)}`;
    const results = await makeQuery(sql)
      .catch(() => { res.status(500).send('An Error occurred while connecting to the database'); });
    if (!results.affectedRows) {
      res.status(404).send(`Student with ID ${req.params.id} not found`);
    } else {
      res.status(200).send({ 'id': Number(req.params.id) });
    }
  }
});

server.post('/api/grades', async (req, res) => {
  const reqProps = ['name', 'course', 'grade'];
  for (let prop in reqProps) {
    if (!req.body[reqProps[prop]]) {
      res.status(400).send(`Student ${reqProps[prop]} required`);
      return;
    }
  }
  const { name, course, grade } = req.body;
  let sql = `INSERT INTO grades (id, name, course, grade) VALUES (NULL, ?, ?, ?)`;
  const inserts = [name, course, grade];
  sql = mysql.format(sql, inserts);
  const results = await makeQuery(sql)
    .catch(() => { res.status(500).send('An Error occurred while connecting to the database'); });
  res.status(200).send({ 'id': results.insertId, 'name': name, 'course': course, 'grade': grade });
});

server.patch('/api/grades/:id', async (req, res) => {
  if (!req.params.id) {
    res.status(400).send('Student ID required');
  } else {
    const reqProps = ['name', 'course', 'grade'];
    for (let prop in reqProps) {
      if (!req.body[reqProps[prop]]) {
        res.status(400).send(`Student ${reqProps[prop]} required`);
        return;
      }
    }
    const { name, course, grade } = req.body;
    let sql = `UPDATE grades SET name = ?, course = ?, grade = ? WHERE id = ?`;
    const inserts = [name, course, grade, req.params.id];
    sql = mysql.format(sql, inserts);
    const results = await makeQuery(sql)
      .catch(() => { res.status(500).send('An Error occurred while connecting to the database'); });
    if (!results.affectedRows) {
      res.status(404).send(`Student with ID ${req.params.id} not found`);
    } else {
      res.status(200).send({ 'id': req.params.id, 'name': name, 'course': course, 'grade': grade });
    }
  }
});

server.listen(3001, () => {
  // eslint-disable-next-line no-console
  console.log('Express Server listening on port 3001\n');
});
