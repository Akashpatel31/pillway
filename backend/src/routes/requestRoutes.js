const express = require("express");
const router = express.Router();
const controller = require("../controllers/requestController");

router.post("/", controller.createRequest);
router.get("/user/:userId", controller.getRequestByUserId);

module.exports = router;
