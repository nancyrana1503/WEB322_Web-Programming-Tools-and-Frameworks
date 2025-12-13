const { app, projectData } = require("../app");

let initialized = false;

module.exports = async (req, res) => {
  try {
    console.log("HIT:", req.method, req.url);

    if (!initialized) {
      console.log("Initializing DB...");
      await projectData.initialize();
      initialized = true;
      console.log("DB initialized ✅");
    }

    return app(req, res);
  } catch (err) {
    console.error("Serverless function error:", err);
    return res.status(500).send(err?.message || "Internal Server Error");
  }
};
