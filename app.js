/********************************************************************************
* WEB322 – Assignment 03
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senececollege.ca/about/policies/academic-integrity-policy.html
*
* Name: ____Nancy Rana____ Student ID: __149951238__ Date: ______________
*
* Published URL: ___________________________________________________________
*
********************************************************************************/

const projectData = require("./modules/projects");
const path = require("path");
const express = require("express");
require("dotenv").config();

const clientSessions = require("client-sessions");

const app = express();

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(clientSessions({
  cookieName: "session",
  secret: process.env.SESSIONSECRET,
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}));

// Make session available in all views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Protect routes middleware
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

/* ---------------- ROUTES ---------------- */

// Home
app.get("/", (req, res) => {
  res.render("home");
});

// About
app.get("/about", (req, res) => {
  res.render("about");
});

// Login / Logout
app.get("/login", (req, res) => {
  res.render("login", { errorMessage: "", userName: "" });
});

app.post("/login", (req, res) => {
  const { userName, password } = req.body;

  if (userName === process.env.ADMINUSER && password === process.env.ADMINPASSWORD) {
    req.session.user = { userName };
    return res.redirect("/solutions/projects");
  }

  return res.render("login", {
    errorMessage: "Invalid User Name or Password",
    userName
  });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

// All Projects + Sector Filter
app.get("/solutions/projects", async (req, res) => {
  try {
    if (req.query.sector) {
      const projects = await projectData.getProjectsBySector(req.query.sector);
      return res.render("projects", { projects });
    }

    const projects = await projectData.getAllProjects();
    return res.render("projects", { projects });
  } catch (err) {
    if (req.query.sector) {
      return res
        .status(404)
        .render("404", { message: `No projects found for sector: ${req.query.sector}` });
    }

    return res.status(404).render("404", { message: err });
  }
});

// Single Project
app.get("/solutions/projects/:id", async (req, res) => {
  try {
    const project = await projectData.getProjectById(req.params.id);
    res.render("project", { project });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

// Add Project (protected)
app.get("/solutions/addProject", ensureLogin, (req, res) => {
  res.render("addProject");
});

app.post("/solutions/addProject", ensureLogin, (req, res) => {
  delete req.body.id;
  req.body.sector_id = parseInt(req.body.sector_id);

  projectData.addProject(req.body)
    .then(() => res.redirect("/solutions/projects"))
    .catch(err =>
      res.status(500).render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`
      })
    );
});

// Edit Project (protected)
app.get("/solutions/editProject/:id", ensureLogin, (req, res) => {
  projectData.getProjectById(parseInt(req.params.id))
    .then(project => res.render("editProject", { project }))
    .catch(err => res.status(404).render("404", { message: err }));
});

app.post("/solutions/editProject", ensureLogin, (req, res) => {
  req.body.sector_id = parseInt(req.body.sector_id);

  projectData.editProject(req.body.id, req.body)
    .then(() => res.redirect("/solutions/projects"))
    .catch(err =>
      res.status(500).render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`
      })
    );
});

// Delete Project (protected)
app.get("/solutions/deleteProject/:id", ensureLogin, (req, res) => {
  projectData.deleteProject(req.params.id)
    .then(() => res.redirect("/solutions/projects"))
    .catch(err =>
      res.status(500).render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`
      })
    );
});

// 404
app.use((req, res) => {
  res.status(404).render("404", {
    message: "I'm sorry, we're unable to find what you're looking for"
  });
});

module.exports = { app, projectData };
