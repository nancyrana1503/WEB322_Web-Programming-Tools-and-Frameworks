require("pg");
const Sequelize = require("sequelize");

// DB connection
const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    dialect: "postgres",
    dialectOptions: {
      ssl: { rejectUnauthorized: false }
    }
  }
);

// Models
const Sector = sequelize.define("Sector", {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  sector_name: Sequelize.STRING
}, { timestamps: false });

const Project = sequelize.define("Project", {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  title: Sequelize.STRING,
  feature_img_url: Sequelize.STRING,
  summary_short: Sequelize.TEXT,
  intro_short: Sequelize.TEXT,
  impact: Sequelize.TEXT,
  original_source_url: Sequelize.STRING
}, { timestamps: false });

Project.belongsTo(Sector, { foreignKey: "sector_id" });

/* seed data */
async function seed() {
  const sectorData = require("../data/sectorData.json");
  const projectData = require("../data/projectData.json");

  const sectorCount = await Sector.count();
  const projectCount = await Project.count();

  if (sectorCount === 0) {
    await Sector.bulkCreate(sectorData);
    console.log("Seeded sectors:", sectorData.length);
  }

  if (projectCount === 0) {
    await Project.bulkCreate(projectData);
    console.log("Seeded projects:", projectData.length);
  }
}

/* Fix postgres ID sequences */
async function fixSequences() {
  await sequelize.query(`
    SELECT setval(
      pg_get_serial_sequence('"Projects"', 'id'),
      (SELECT COALESCE(MAX(id), 1) FROM "Projects")
    );
  `);

  await sequelize.query(`
    SELECT setval(
      pg_get_serial_sequence('"Sectors"', 'id'),
      (SELECT COALESCE(MAX(id), 1) FROM "Sectors")
    );
  `);
}

/* initialize */
async function initialize() {
  await sequelize.sync();
  await seed();
  await fixSequences();
}

/* Query functions */
function getAllProjects() {
  return Project.findAll({ include: [Sector] });
}

function getProjectById(projectId) {
  return Project.findAll({
    include: [Sector],
    where: { id: projectId }
  }).then(rows => {
    if (!rows || rows.length === 0) throw "Unable to find requested project";
    return rows[0];
  });
}

function getProjectsBySector(sector) {
  return Project.findAll({
    include: [Sector],
    where: {
      "$Sector.sector_name$": {
        [Sequelize.Op.iLike]: `%${sector}%`
      }
    }
  }).then(rows => {
    if (!rows || rows.length === 0) throw "Unable to find requested projects";
    return rows;
  });
}

function getAllSectors() {
  return Sector.findAll();
}

/* crud */
function addProject(projectData) {
  return Project.create(projectData)
    .then(() => {})
    .catch(err => { throw err.errors[0].message; });
}

function editProject(id, projectData) {
  return Project.update(projectData, { where: { id } })
    .then(() => {})
    .catch(err => { throw err.errors[0].message; });
}

function deleteProject(id) {
  return Project.destroy({ where: { id } })
    .then(() => {})
    .catch(err => { throw err.errors[0].message; });
}

/* export */
module.exports = {
  initialize,
  getAllProjects,
  getProjectById,
  getProjectsBySector,
  getAllSectors,
  addProject,
  editProject,
  deleteProject
};
