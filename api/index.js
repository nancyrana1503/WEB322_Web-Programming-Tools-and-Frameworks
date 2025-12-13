const { app, projectData } = require("../app");

let initialized = false;

module.exports = async (req, res) => {
  if (!initialized) {
    await projectData.initialize();
    initialized = true;
  }
  return app(req, res);
};
