const username = document.getElementById("username");
const pass = document.getElementById('pass');
const btn = document.getElementById("login");

btn.addEventListener('click', () => {
  const obj = {
    user: username.value,
    pass: pass.value
  };
  
  fetch('/loginUser', {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(obj)
  }).then((res) => {
    if (!res.ok) {
      throw new Error("Failed " + res.statusText);
    }
    return res.json();
  })
  .then((data) => {
   
    if(data.message=="Login successful") 
    {
      window.location.href = "/todo";
    }
    else if(data.message=='User not found. Please sign up first.')
    {
      alert(data.message);
      window.location.href = "/signup";
    }
    else {
      alert(data.message);
    }
  })
  .catch((err) => {
    console.log("Error in login:", err);
  });
});
