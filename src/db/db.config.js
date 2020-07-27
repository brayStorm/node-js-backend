module.exports = {
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres"
  },
  development: {
    username: 'postgres',
    dialect: 'postgres',
    password: '',
    database: 'development',
    host: 'localhost',
    logging: console.log,
  }
};
