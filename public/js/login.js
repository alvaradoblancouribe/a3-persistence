const login=function(e){
    const username = document.querySelector('#inputEmail'),
          password= document.querySelector('#inputPassword'),
          json = {username: username.value, password:password.value},
          body = JSON.stringify(json)
    fetch('/login',{
      method:'POST',
      headers:{
        'Content-Type': 'application/json;charset=utf-8'
      },
      credentials: 'include',
      body: body
    })
    .then(response=> response.json())
    .then(json=>{
        console.log("this worked??")
        //window.location.assign('/')
        window.location.href = json.url
    })
    return false;
  }

  window.onload = function() {
    const loginButton = document.getElementById('login')
    loginButton.onclick= login
  }
