/********************************************************************************
* WEB322 – Assignment 03
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
*
* Name: ____Nancy Rana____ Student ID: __149951238__ Date: ______________
*
* Published URL: ___________________________________________________________
*
********************************************************************************/

require("dotenv").config();

const { app, projectData } = require("./app");

const HTTP_PORT = process.env.PORT || 8080;

projectData.initialize().then(() => {
  app.listen(HTTP_PORT, () => console.log(`server listening on: ${HTTP_PORT}`));
}).catch((err) => {
  console.log("Failed to initialize:", err);
});
