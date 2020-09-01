(function () {
  const messages = document.querySelector('#messages');
  const wsButton = document.querySelector('#wsButton');
  const wsSendButton = document.querySelector('#wsSendButton');
  const logout = document.querySelector('#logout');
  const login = document.querySelector('#login');
  const txtGameId = document.getElementById('txtGameId');
  const btnStartGame = document.getElementById('startGame');
  const claimQuantity = document.getElementById('claimQuantity');
  const claimValue = document.getElementById('claimValue');
  const claim = document.getElementById('claim');
  const cheat = document.getElementById('cheat');

  function showMessage(message) {
    messages.textContent += `\n${message}`;
    messages.scrollTop = messages.scrollHeight;
  }

  async function handleResponse(response) {
    let res = await response.json().then((data) => JSON.stringify(data, null, 2));
    return response.ok
      ? res
      : Promise.reject(new Error(res));
  }

  login.onclick = function () {
    fetch('/login', { method: 'POST', credentials: 'same-origin' })
      .then(handleResponse)
      .then(showMessage)
      .catch(function (err) {
        showMessage(err.message);
      });
  };

  logout.onclick = function () {
    fetch('/logout', { method: 'DELETE', credentials: 'same-origin' })
      .then(handleResponse)
      .then(showMessage)
      .catch(function (err) {
        showMessage(err.message);
      });
  };

  let ws;

  wsButton.onclick = function () {
    if (ws) {
      ws.onerror = ws.onopen = ws.onclose = null;
      ws.close();
    }

    ws = new WebSocket(`ws://${location.host}`);
    ws.onerror = function () {
      showMessage('WebSocket error');
    };
    ws.onopen = function () {
      showMessage('WebSocket connection established');
    };
    ws.onmessage = function (message) {
      showMessage(message.data);
    }
    ws.onclose = function () {
      showMessage('WebSocket connection closed');
      ws = null;
    };
  };

  btnStartGame.onclick = function(){
    const gameId = txtGameId.value;
    showMessage(`posting to /game/${gameId}/start`);
    fetch(`/game/${gameId}/start`, { 
      method: 'POST', 
      credentials: 'same-origin'
    })
    .then(handleResponse)
    .then(showMessage)
    .catch(function (err) {
      showMessage(err.message);
    });
  }
  
  claim.onclick = function(){
    const gameId = txtGameId.value;
    const quantity = claimQuantity.value;
    const value = claimValue.value;
    if (!ws) {
      showMessage('No WebSocket connection');
      return;
    }

    const gameMessage = {
      messageType: 3,
      message: {
        quantity: quantity,
        value: value,
        cheat: false
      }
    }
    var msg = JSON.stringify(gameMessage);

    showMessage(`posting ${msg} to /game/${gameId}/claim`);
    fetch(`/game/${gameId}/claim`, { 
        method: 'POST', 
        credentials: 'same-origin', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: msg
      })
      .then(handleResponse)
      .then(showMessage)
      .catch(function (err) {
        showMessage(err.message);
      });
  }
  
  cheat.onclick = function(){
    const gameId = txtGameId.value;
    const quantity = claimQuantity.value;
    const value = claimValue.value;
    if (!ws) {
      showMessage('No WebSocket connection');
      return;
    }

    const gameMessage = {
      messageType: 3,
      message: {
        quantity: null,
        value: null,
        cheat: true
      }
    }
    var msg = JSON.stringify(gameMessage);

    showMessage(`posting ${msg} to /game/${gameId}/claim`);
    fetch(`/game/${gameId}/claim`, { 
        method: 'POST', 
        credentials: 'same-origin', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: msg
      })
      .then(handleResponse)
      .then(showMessage)
      .catch(function (err) {
        showMessage(err.message);
      });
  }

  wsCreateGame.onclick = function () {
    var msg = JSON.stringify({gameId: 100});
    showMessage(`posting ${msg} to /game/create`);
    fetch('/game/create', { 
        method: 'POST', 
        credentials: 'same-origin', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: msg
      })
      .then(handleResponse)
      .then(showMessage)
      .catch(function (err) {
    showMessage(err.message);
  });
  };

  wsJoinGame.onclick = function () {
    const gameId = txtGameId.value;
    var name = JSON.stringify({name: 'bob'});
    showMessage(`posting to /game/${gameId}/join`);
    fetch(`/game/${gameId}/join`, { 
        method: 'POST', 
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: name
      })
      .then(handleResponse)
      .then(showMessage)
      .catch(function (err) {
        showMessage(err.message);
      });
    // if (!ws) {
    //   showMessage('No WebSocket connection');
    //   return;
    // }

    // const joinRequest = {
    //   type: 'join',
    //   gameId: 100
    // }

    // const message = JSON.stringify(joinRequest,null, 2);
    // ws.send(message);
    // showMessage(`Sent ${message}`);
  };

})();
