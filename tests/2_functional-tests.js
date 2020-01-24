/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function() {
  let thread_id1,
    thread_id2,
    reply_id = null;

  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      //need to create two thread so as to test deletion with one
      test("POST 2 requests with text & delete_password", function(done) {
        chai
          .request(server)
          .post("/api/threads/test")
          .send({ text: "TestThread1", delete_password: "testpwd1" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
          });
        chai
          .request(server)
          .post("/api/threads/test")
          .send({ text: "TestThread2", delete_password: "testpwd2" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            done();
          });
      });
    });

    suite("GET", function() {
      test("GET 10 most recent threads and replies", function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            res.body.forEach(el => {
              assert.property(el, "_id");
              assert.property(el, "text");
              assert.property(el, "created_on");
              assert.property(el, "bumped_on");
              assert.property(el, "replies");
              assert.isArray(el.replies);
              assert.property(el, "replycount");
              assert.isNumber(el.replycount);
              assert.notProperty(el, "reported");
              assert.notProperty(el, "delete_password");
            });
            thread_id1 = res.body[0]._id;
            thread_id2 = res.body[1]._id;
            done();
          });
      });
    });
    suite("DELETE", function() {
      test("delete thread with invalid_id", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .send({ thread_id: "2394809384", delete_password: "fghkxc" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "invalid thread_id");
            done();
          });
      });
      test("delete thread with incorrect password", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .send({ thread_id: thread_id1, delete_password: "fghkxc" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });
      test("delete thread with correct password", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .send({ thread_id: thread_id1, delete_password: "testpwd2" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });

    suite("PUT", function() {
      test("report thread with invalid thread_id", function(done) {
        chai
          .request(server)
          .put("/api/threads/test")
          .send({ thread_id: "049859043m-0uwg" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "invalid thread_id");
            done();
          });
      });
      test("report thread with valid thread_id", function(done) {
        chai
          .request(server)
          .put("/api/threads/test")
          .send({ thread_id: thread_id2 })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      test("POST reply to thread", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            text: "TestThread1Reply",
            delete_password: "testReplyPwd1",
            thread_id: thread_id2
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            done();
          });
      });
    });

    suite("GET", function() {
      test("GET replies to thread", function(done) {
        chai
          .request(server)
          .get("/api/replies/test")
          .query({
            thread_id: thread_id2
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.property(res.body, "_id");
            assert.property(res.body, "created_on");
            assert.property(res.body, "bumped_on");
            assert.property(res.body, "replies");
            assert.isArray(res.body.replies);
            assert.isAtLeast(res.body.replies.length, 1);
            assert.equal(res.body.bumped_on, res.body.replies[0].created_on);
            reply_id = res.body.replies[0]._id;
            done();
          });
      });
    });

    suite("PUT", function() {
      test("PUT reported on reply to thread", function(done) {
        chai
          .request(server)
          .put("/api/replies/test")
          .send({
            thread_id: thread_id2,
            reply_id: reply_id
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("DELETE reply to thread with incorrect password", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .send({
            thread_id: thread_id2,
            reply_id: reply_id,
            delete_password: "testReplPwd1"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });
      test("DELETE reply to thread with correct password", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .send({
            thread_id: thread_id2,
            reply_id: reply_id,
            delete_password: "testReplyPwd1"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
  });
});
