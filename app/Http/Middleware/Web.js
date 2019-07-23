'use strict'

class Web {

  * handle (request, response, next) {

    let user = yield request.session.get('user');
    if (user !== undefined && user)
      yield next;
    else
      response.redirect('back');
  }

}

module.exports = Web;
