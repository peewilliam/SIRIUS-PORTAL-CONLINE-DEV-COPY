const sql = require('mssql');
require('dotenv').config()

const config = {
  user: process.env.HEADCARGO_DB_USER,
  password: process.env.HEADCARGO_DB_PASSWORD,
  server: process.env.HEADCARGO_DB_HOST,
  database: process.env.HEADCARGO_DB_NAME,
  port: Number(process.env.HEADCARGO_DB_PORT),
  options: {
    encrypt: false,
    requestTimeout: 200000 // tempo limite em milissegundos
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};



const pool = new sql.ConnectionPool(config);

pool.on('error', err => {
  console.error(`SQL Server pool error: ${err}`);
});

const executeQuerySQL = async (query) => {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    try {
      const connection = await pool.connect();
      const results = await connection.request().query(query);
      connection.release();
      return results.recordset;
    } catch (error) {
      attempts += 1;
      console.error(`Error executing query: ${error}. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Failed to execute query after ${attempts} attempts.`);
};


module.exports = {
    headCargoQuery: executeQuerySQL,
};
