'use strict'

const crypto = use('crypto')
const User = use('App/Model/User');
const Env = use('Env');

class AuthController {
  * index (request, response) {

    let user = yield request.session.get('user');
    if (user !== undefined && !user) {
      yield response.sendView('auth.login');
      return;
    }

    return response.redirect('/home');
  }

  * login (request, response) {

    const Validator = use('Validator');
    const validation = yield Validator.validate(request.all(), {
      email: 'required',
      password: 'required'
    })

    if (validation.fails()) {
      yield request.withAll().andWith({ errors: validation.messages() }).flash();
      return response.redirect('back');
    }

    let email = request.input('email');
    let password = request.input('password');

    let user = yield User.findBy('email', email);

    if (user === undefined || !user) {
      yield request.with({error: 'Invalid email id'}).flash();
      return response.redirect('back');
    }

    const md5sum = crypto.createHash('md5');
    let hashedpsw = user.salt + password;
    hashedpsw = md5sum.update(hashedpsw).digest('hex');

    if (user.password !== hashedpsw) {
      yield request.with({error: 'Invalid password'}).flash();
      return response.redirect('back');
    }

    yield request.auth.loginViaId(user.id);
    yield request.session.put('user', user);
    response.redirect('/home');
  }

  * signup (request, response) {

    yield request.with({success: 'sign begins'}).flash();

    let user = yield request.session.get('user');
    if (user !== undefined && !user) {
      yield response.sendView('auth.signup');
      return;
    }

    return response.redirect('/home');
  }

  * register (request, response) {

    const Validator = use('Validator');
    const validation = yield Validator.validate(request.all(), {
      email: 'required',
      password: 'required',
      confirmed: 'required'
    })

    if (validation.fails()) {
      yield request.withAll().andWith({ errors: validation.messages() }).flash()
      response.redirect('back')
      return
    }

    if (request.input('password') !== request.input('confirmed')) {
      yield request.withAll().andWith({ error: 'Password do not match.' }).flash()
      response.redirect('back')
      return
    }

    const email = request.input('email')
    const password = request.input('password')
    const md5sum = crypto.createHash('md5')

    let user = yield User.findBy('email', email);

    if (user !== undefined && user) {

      yield request.with({ error: 'Email already registered' }).flash()
      return response.redirect('back');
    } else {

      let salt = Math.random().toString(36).substring(6)
      let hashedpw = salt + password;
      hashedpw = md5sum.update(hashedpw).digest('hex')

      let user = new User();
      user.email = email;
      user.password = hashedpw;
      user.salt = salt;
      yield user.save()

      yield request.auth.loginViaId(user.id);
      yield request.session.put('user', user);
      response.redirect('/home');
    }
  }

  * logout(request, response) {
    yield request.auth.logout();
    yield request.session.forget('user');
    response.redirect('/login');
  }
}

module.exports = AuthController
