/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *
 */

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { supabase, dbTables } = require('../database/db');

chai.use(chaiHttp);

let bookId = '';

suite('Functional Tests', function () {
  suite('Routing tests', function () {
    suite(
      'POST /api/books with title => create book object/expect book object',
      function () {
        test('Test POST /api/books with title', function (done) {
          const title = 'test-title';
          chai
            .request(server)
            .post('/api/books')
            .send({ title })
            .end((err, res) => {
              assert.property(
                res.body,
                'title',
                'Response should have "title"'
              );
              assert.equal(res.body.title, title);
              assert.property(res.body, '_id', 'Response should have "_id"');
              assert.equal(res.status, 200, 'Response should have status 200');

              bookId = res.body._id;
              done();
            });
        });

        test('Test POST /api/books with no title given', function (done) {
          const title = 'test-title';
          chai
            .request(server)
            .post('/api/books')
            .send({ name: title })
            .end((err, res) => {
              assert.equal(res.text, 'missing required field title');
              assert.equal(res.status, 200, 'Response should have status 200');
              done();
            });
        });
      }
    );

    suite('GET /api/books => array of books', function () {
      test('Test GET /api/books', function (done) {
        chai
          .request(server)
          .get('/api/books')
          .end((err, res) => {
            assert.isArray(res.body, 'response should be an array of books');
            assert.isAbove(res.body.length, 0);

            for (const book of res.body) {
              assert.property(book, '_id', 'Response should have "_id"');
              assert.property(book, 'title', 'Response should have "title"');
              assert.property(
                book,
                'commentcount',
                'Response should have "commentcount"'
              );
            }

            assert.equal(res.status, 200, 'Response should have status 200');
            done();
          });
      });
    });

    suite('GET /api/books/[id] => book object with [id]', function () {
      test('Test GET /api/books/[id] with id not in db', function (done) {
        chai
          .request(server)
          .get('/api/books/' + bookId + 'a')
          .end((err, res) => {
            assert.equal(res.text, 'no book exists');
            assert.equal(res.status, 200, 'Response should have status 200');
            done();
          });
      });

      test('Test GET /api/books/[id] with valid id in db', function (done) {
        chai
          .request(server)
          .get('/api/books/' + bookId)
          .end((err, res) => {
            assert.property(res.body, '_id', 'Response should have "_id"');
            assert.property(res.body, 'title', 'Response should have "title"');
            assert.property(
              res.body,
              'comments',
              'Response should have "comments"'
            );
            assert.equal(res.status, 200, 'Response should have status 200');
            done();
          });
      });
    });

    suite(
      'POST /api/books/[id] => add comment/expect book object with id',
      function () {
        const testComment = 'test commentl';

        test('Test POST /api/books/[id] with comment', function (done) {
          chai
            .request(server)
            .post('/api/books/' + bookId)
            .send({ comment: testComment })
            .end((err, res) => {
              assert.property(res.body, '_id', 'Response should have "_id"');
              assert.property(
                res.body,
                'title',
                'Response should have "title"'
              );
              assert.property(
                res.body,
                'comments',
                'Response should have "comments"'
              );
              assert.equal(res.status, 200, 'Response should have status 200');
              done();
            });
        });

        test('Test POST /api/books/[id] without comment field', function (done) {
          chai
            .request(server)
            .post('/api/books/' + bookId)
            .send({ coment: testComment })
            .end((err, res) => {
              assert.equal(res.text, 'missing required field comment');
              assert.equal(res.status, 200, 'Response should have status 200');
              done();
            });
        });

        test('Test POST /api/books/[id] with comment, id not in db', function (done) {
          chai
            .request(server)
            .post('/api/books/' + bookId + 'a')
            .send({ comment: testComment })
            .end((err, res) => {
              assert.equal(res.text, 'no book exists');
              assert.equal(res.status, 200, 'Response should have status 200');
              done();
            });
        });
      }
    );

    suite('DELETE /api/books/[id] => delete book object id', function () {
      test('Test DELETE /api/books/[id] with valid id in db', function (done) {
        chai
          .request(server)
          .delete('/api/books/' + bookId)
          .end((err, res) => {
            assert.equal(res.text, 'delete successful');
            assert.equal(res.status, 200, 'Response should have status 200');

            supabase
              .from(dbTables.books)
              .select('*', { count: 'exact' })
              .match({ _id: bookId })
              .then(({ count, error }) => {
                assert.equal(count, 0);
                done();
              });
          });
      });

      test('Test DELETE /api/books/[id] with  id not in db', function (done) {
        chai
          .request(server)
          .delete('/api/books/' + bookId)
          .end((err, res) => {
            assert.equal(res.text, 'no book exists');
            assert.equal(res.status, 200, 'Response should have status 200');
            done();
          });
      });
    });
  });
});
