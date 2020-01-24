/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

const expect = require("chai").expect;
const BoardHandler = require("../controllers/boardHandler.js");

module.exports = function(app) {
  const boardHandler = new BoardHandler();
  app
    .route("/api/threads/:board")
    .get(boardHandler.listThreads)
    .post(boardHandler.createThread)
    .put(boardHandler.reportThread)
    .delete(boardHandler.deleteThread);

  app
    .route("/api/replies/:board")
    .get(boardHandler.showThreadReplies)
    .post(boardHandler.createReply)
    .put(boardHandler.reportReply)
    .delete(boardHandler.deleteReply);
};
