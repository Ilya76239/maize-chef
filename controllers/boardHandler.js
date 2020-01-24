"use strict";

const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;

function BoardHandler() {
  //list the most recent threads from GET request
  this.listThreads = (req, res) => {
    //GET an array of most recent 10 bumped threads on board with only the most recent 3 replies from /api/threads/{board}.
    //The reported and delete_passwords fields will not be sent.
    const board = req.params.board;

    MongoClient.connect(MONGODB_CONNECTION_STRING)
      .then(db => {
        db.collection(board)
          .aggregate([
            { $sort: { bumped_on: -1 } },
            { $limit: 10 },
            {
              $project: {
                text: 1,
                created_on: 1,
                bumped_on: 1,
                replies: { $slice: ["$replies", 3] },
                replycount: { $size: "$replies" }
              }
            },
            {
              $unset: ["replies.reported", "replies.delete_password"]
            }
          ])
          .toArray()
          .then(result => {
            res.send(result);
            db.close();
          })
          .catch(err => res.send(err));
      })
      .catch(err => res.send(err));
  };
  //create new thread from POST request
  this.createThread = (req, res) => {
    const board = req.params.board;
    const date = new Date();
    const thread = {
      text: req.body.text,
      created_on: date,
      bumped_on: date,
      reported: false,
      delete_password: req.body.delete_password,
      replies: []
    };

    MongoClient.connect(MONGODB_CONNECTION_STRING)
      .then(db => {
        db.collection(board)
          .insertOne(thread)
          .then(result => {
            res.redirect(`/b/${board}/`);
            db.close();
          })
          .catch(err => res.send(err));
      })
      .catch(err => res.send(err));
  };
  //mark thread reported from PUT request
  this.reportThread = (req, res) => {
    const board = req.params.board;
    const threadId = req.body.thread_id;

    if (!ObjectId.isValid(threadId)) {
      res.send("invalid thread_id");
      return;
    }

    MongoClient.connect(MONGODB_CONNECTION_STRING)
      .then(db => {
        db.collection(board)
          .findOneAndUpdate(
            { _id: ObjectId(threadId) },
            { $set: { reported: true } }
          )
          .then(result => {
            result.value ? res.send("success") : res.send("invalid thread_id");
            db.close();
          })
          .catch(err => console.log(err));
      })
      .catch(err => res.send(err));
  };
  //delete thread from DELETE request
  this.deleteThread = (req, res) => {
    const board = req.params.board;
    const threadId = req.body.thread_id;
    const delPwd = req.body.delete_password;
    
    if (!ObjectId.isValid(threadId)) {
      res.send("invalid thread_id");
      return;
    }

    MongoClient.connect(MONGODB_CONNECTION_STRING)
      .then(db => {
        db.collection(board)
          .findOneAndDelete({
            _id: ObjectId(threadId),
            delete_password: delPwd
          })
          .then(result => {
            result.value ? res.send("success") : res.send("incorrect password");
            db.close();
          })
          .catch(err => res.send(err));
      })
      .catch(err => res.send(err));
  };
  //GET thread and replies
  this.showThreadReplies = (req, res) => {
    const board = req.params.board;
    const threadId = req.query.thread_id;
    
    if (!ObjectId.isValid(threadId)) {
      res.send("invalid thread_id");
      return;
    }

    MongoClient.connect(MONGODB_CONNECTION_STRING)
      .then(db => {
        db.collection(board)
          .findOne(
            { _id: ObjectId(threadId) },
            {
              reported: 0,
              delete_password: 0,
              "replies.reported": 0,
              "replies.delete_password": 0
            }
          )
          .then(result => {
            res.send(result);
            db.close();
          })
          .catch(err => console.error(err));
      })
      .catch(err => console.error(err));
  };
  //insert reply to thread
  this.createReply = (req, res) => {
    const board = req.params.board;
    const threadId = req.body.thread_id;
    const reply = {
      _id: new ObjectId(),
      text: req.body.text,
      created_on: new Date(),
      delete_password: req.body.delete_password,
      reported: false
    };
    
    if (!ObjectId.isValid(threadId)) {
      res.send("invalid thread_id");
      return;
    }

    MongoClient.connect(MONGODB_CONNECTION_STRING)
      .then(db => {
        db.collection(board)
          .findOneAndUpdate(
            { _id: ObjectId(threadId) },
            {
              $push: { replies: { $each: [reply], $position: 0 } },
              $set: { bumped_on: reply.created_on }
            }
          )
          .then(result => {
            db.close();
            res.redirect(`/b/${board}/${threadId}`);
          })
          .catch(err => console.error(err));
      })
      .catch(err => console.error(err));
  };
  //mark reply reported from PUT request
  this.reportReply = (req, res) => {
    const board = req.params.board;
    const threadId = req.body.thread_id;
    const replyId = req.body.reply_id;
    
    if (!ObjectId.isValid(threadId)) {
      res.send("invalid thread_id");
      return;
    }
    else if (!ObjectId.isValid(replyId)) {
      res.send("invalid reply_id");
      return;
    }

    MongoClient.connect(MONGODB_CONNECTION_STRING)
      .then(db => {
        db.collection(board)
          .findOneAndUpdate(
            {
              _id: ObjectId(threadId),
              replies: {
                $elemMatch: { _id: ObjectId(replyId) }
              }
            },
            { $set: { "replies.$.reported": true } }
          )
          .then(result => {
            result.value ? res.send("success") : res.send("invalid reply_id");
            db.close();
          })
          .catch(err => console.error(err));
      })
      .catch(err => res.send(err));
  };
  //delete reply from delete request
  this.deleteReply = (req, res) => {
    const board = req.params.board;
    const threadId = req.body.thread_id;
    const replyId = req.body.reply_id;
    const delPwd = req.body.delete_password;
    
     if (!ObjectId.isValid(threadId)) {
      res.send("invalid thread_id");
      return;
    }
    else if (!ObjectId.isValid(replyId)) {
      res.send("invalid reply_id");
      return;
    }

    MongoClient.connect(MONGODB_CONNECTION_STRING)
      .then(db => {
        db.collection(board)
          .findOneAndUpdate(
            {
              _id: ObjectId(threadId),
              replies: {
                $elemMatch: { _id: ObjectId(replyId), delete_password: delPwd }
              }
            },
            { $set: { "replies.$.text": "[deleted]" } }
          )
          .then(result => {
            result.value ? res.send("success") : res.send("incorrect password");
            db.close();
          })
          .catch(err => console.error(err));
      })
      .catch(err => res.send(err));
  };
}
module.exports = BoardHandler;
