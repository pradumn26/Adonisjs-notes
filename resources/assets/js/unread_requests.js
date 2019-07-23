function checkUnreadRequests() {
  $.get("/requests/getUnreadRequests",
  function (data, status){
    if (status === 'success') {
      $('#unread-requests-count').html(data.length);
      let domElement = $('#request-widget');
      let requestsHTML = '';

      if(data.length) {
        for (const request of data) {
          requestsHTML +=  `<a href="javascript:void(0)">
                                <div class="user-img"><img class="square" src="${request.image}"/></div>
                                <div class="mail-content">
                                    <h5>${request.request_type_name}</h5>
                                    <span class="mail-desc">${request.guest.name}` + (request.guest.phone ? ` | ${request.guest.phone}` : ``) + `</span>
                                    <span class="mail-desc">${request.guest.email}` + (request.room ? ` | Room: ${request.room}` : ``) + `</span>
                                    <span class="time">${request.created_at}</span>
                                </div>
                            </a>`;
        }
      } else {
        requestsHTML = '<div class="no-unread-requests">You have read all your requests!</div>'
      }

      domElement.html(requestsHTML);
    } else {
      console.log('There was an error fetching unread requests!')
    }
  })
}

let unreadRequestInterval = 1000 * 10;
setInterval(checkUnreadRequests, unreadRequestInterval);
checkUnreadRequests();

function readAllRequests () {
  let currentTimestamp = moment().format('YYYY-MM-DD HH:mm')
  $.post(
    "/requests/markRead",
    {
      currentTimestamp: currentTimestamp
    })
  .done(function (data) {
    // Update the Floating Button
    let requestsHTML = '<div class="no-unread-requests">You have read all your requests!</div>';
    $('#unread-requests-count').html(data.length);
    $('#request-widget').html(requestsHTML);
  })
}

$('#clear-unread-requests').click(function(e) {
  readAllRequests()
})