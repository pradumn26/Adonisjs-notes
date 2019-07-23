'use strict';

class NotesController {
  * index(request, response) {
    let user_id = (yield request.session.get('user')).id;
    let Note = use('App/Model/Note');
    let notes = yield Note.query().where('user_id', user_id);

    notes = notes.map(function (v, i) {
      let date = new Date(v.updated_at);
      v.date = date.getDate() + '/' + (date.getMonth()+1) + '/' + date.getFullYear();
      v.index = i;
      return v;
    });

    yield response.sendView('layouts.notes', {
      notes
    });
  }

  * create(request, response) {
    let title = request.input('title');
    let content = request.input('content');

    let Note = use('App/Model/Note');
    let note = new Note();
    note.title = title;
    note.content = content;
    note.user_id = (yield request.session.get('user')).id;
    try {
      yield note.save();
    } catch (e) {
      console.log(e);
      return response.redirect('/home');
    }

    response.redirect('/home');
  }

  * fetchNotes(request, response) {
    let user_id = (yield request.session.get('user')).id;
    let Note = use('App/Model/Note');
    let notes = yield Note.query().where('user_id', user_id);

    notes = notes.map(function (v, i) {
      let date = new Date(v.updated_at);
      v.date = date.getDate() + '/' + (date.getMonth()+1) + '/' + date.getFullYear();
      v.index = i;
      return v;
    });

    response.json(notes);
  }
}

module.exports = NotesController;
