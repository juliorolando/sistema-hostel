const Sequelize = require('sequelize');
const { config } = require('../config');

// destructurando archivo config 
const {host,port,user,password,database} = config.db

const path = `mariadb://${user}:${password}@${host}:${port}/${database}`;

const sequelize = new Sequelize(path)

module.exports = {sequelize}