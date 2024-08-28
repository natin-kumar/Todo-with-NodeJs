const username = document.getElementById("username");
const pass = document.getElementById('pass');
const btn = document.getElementById("login");
const mail = document.getElementById('mail');

btn.addEventListener('click', () => {
  const obj = {
    user: username.value,
    mail: mail.value,
    pass: pass.value
  };
  
  fetch('/signup', {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(obj)
  })
  .then((res) => {
    if (!res.ok) {
      return res.json().then(error => { throw new Error(error.message); });
    }
    return res.json();
  })
  .then((data) => {
    alert(data.message);
    if (data.message == 'User registered successfully.'|| data.message== "User already exists." ) {
      window.location.href = "/loginUser";
    }
    if(data.message!="User already exists.")
      window.location.href='/verifyOTP';
    

    
  })
  .catch((err) => {
    alert(err.message);
  });
});
