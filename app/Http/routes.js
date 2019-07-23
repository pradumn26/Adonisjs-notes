'use strict'

/*
|--------------------------------------------------------------------------
| Router
|--------------------------------------------------------------------------
|
| AdonisJs Router helps you in defining urls and their actions. It supports
| all major HTTP conventions to keep your routes file descriptive and
| clean.
|
| @example
| Route.get('/user', 'UserController.index')
| Route.post('/user', 'UserController.store')
| Route.resource('user', 'UserController')
*/

const Route = use('Route');

Route.group('openpages', function () {
  Route.get('/', 'AuthController.index')
  Route.get('/login', 'AuthController.index').as('login')
  Route.post('/login', 'AuthController.login')
  Route.get('/signup', 'AuthController.signup').as('signup')
  Route.post('/signup', 'AuthController.register')
  Route.get('/logout', 'AuthController.logout')
});

Route.group('secured', function () {
  Route.get('/home', 'NotesController.index');
  Route.post('/newNote', 'NotesController.create');
  Route.get('/fetchNotes', 'NotesController.fetchNotes');
}).middleware('web');
