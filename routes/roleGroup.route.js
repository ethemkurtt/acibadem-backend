// routes/roleGroup.route.js
const router = require("express").Router();
const { authRequired } = require("../middlewares/auth");
// İstersen guard ekle: sadece superadmin
// const { requireAnyRole } = require("../middlewares/authz");

const c = require("../controllers/roleGroup.controller");

router.use(authRequired);

// CRUD
router.post("/role-groups", c.createRoleGroup);           // requireAnyRole("superadmin"),
router.get("/role-groups", c.getAllRoleGroups);
router.get("/role-groups/:id", c.getRoleGroupById);
router.put("/role-groups/:id", c.updateRoleGroup);
router.delete("/role-groups/:id", c.deleteRoleGroup);

module.exports = router;
