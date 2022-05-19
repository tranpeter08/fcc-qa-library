/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';
const { supabase, dbTables } = require('../database/db');
const Book = require('../models/Book');
const requiredFields = require('../middlewares/requiredFields');
const Comment = require('../models/Comment');

module.exports = function (app) {
  app
    .route('/api/books')
    .get(async function (req, res, next) {
      try {
        //response will be array of book objects
        //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
        const { data, error } = await supabase.from(dbTables.books).select(`
      _id,
      title,
      commentcount:comments(count)
    `);

        if (error) {
          console.log(error);
          res.send('error retrieving books');
          return;
        }

        for (const book of data) {
          book.commentcount = book.commentcount[0].count;
        }

        res.json(data);
      } catch (error) {
        next(error);
      }
    })

    .post(requiredFields(['title']), async function (req, res, next) {
      try {
        let title = req.body.title;
        const book = new Book(title);
        const { data, error } = await supabase
          .from(dbTables.books)
          .insert([book]);

        if (error) {
          console.log(error);
          res.send('error creating book');
          return;
        }

        res.json(data[0]);

        //response will contain new book object including atleast _id and title
      } catch (error) {
        console.log(error);
        next(error);
      }
    })

    .delete(async function (req, res, next) {
      //if successful response will be 'complete delete successful'
      try {
        const { error } = await supabase
          .from(dbTables.books)
          .delete()
          .neq('title', '');

        if (error) {
          console.log(error);
          res.send('delete error');
          return;
        }

        res.send('complete delete successful');
      } catch (error) {
        next(error);
      }
    });

  const bookParams = `
  _id, 
  title, 
  comments:comments(
    comment
  )
`;

  app
    .route('/api/books/:id')
    .get(async function (req, res) {
      try {
        let bookid = req.params.id;
        //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}

        const { data, error } = await supabase
          .from(dbTables.books)
          .select(bookParams)
          .match({ _id: bookid });

        if (error) {
          console.log(error);
          res.send('no book exists');
          return;
        }

        if (data.length === 0) {
          res.send('no book exists');
          return;
        }

        const book = data[0];
        const comments = book.comments.map((comment) => comment.comment);
        book.comments = comments;

        res.json(book);
      } catch (error) {
        next(error);
      }
    })

    .post(requiredFields(['comment']), async function (req, res, next) {
      try {
        let bookid = req.params.id;
        let comment = req.body.comment;

        // check if bookid exists
        const {
          data: bookData,
          error: bookError,
          count,
        } = await supabase
          .from(dbTables.books)
          .select(bookParams, { count: 'exact' })
          .match({ _id: bookid });

        if (bookError || count === 0) {
          res.send('no book exists');
          return;
        }

        const book = bookData[0];
        const comments = book.comments.map((comment) => comment.comment);
        book.comments = comments;

        // create new comment
        const payload = new Comment(comment, bookid);
        const { error: commentError } = await supabase
          .from(dbTables.book_comments)
          .insert([payload]);

        if (commentError) {
          console.log(error);
          res.send('error creating comment');
          return;
        }

        // update the book object
        book.comments.push(comment);

        res.json(book);
      } catch (error) {
        next(error);
      }
    })

    .delete(async function (req, res) {
      let bookid = req.params.id;

      // check if book exists
      const { error: bookError, count } = await supabase
        .from(dbTables.books)
        .select('_id', { count: 'exact' })
        .match({ _id: bookid });

      if (bookError || count === 0) {
        console.log(bookError);
        res.send('no book exists');
        return;
      }

      // delete book, table contraint will remove associated comments from the comments table
      const { error: deleteBooksErr } = await supabase
        .from(dbTables.books)
        .delete()
        .match({ _id: bookid });

      if (deleteBooksErr) {
        console.log(deleteBooksErr);
        res.send('error deleting books');
        return;
      }

      res.send('delete successful');
    });
};
