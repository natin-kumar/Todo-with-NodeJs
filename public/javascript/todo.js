const taskname = document.getElementById("taskName");
const addbtn = document.getElementById("add");
const container = document.querySelector(".listContainer");

function createDom(data) {
  const newdiv = document.createElement("div");
  newdiv.classList.add("div");
  newdiv.id = data.TaskId;
  const isChecked = data.check ? "checked" : "";
  newdiv.innerHTML = `
    <p class="para" onclick="editFun(this)">${data.task}</p>
    <input type="text" name="texthidden" class="texthidden" style="display:none;">
    <input type="checkbox" class="checkbox" ${isChecked} onclick="checkFun(this)">
    <button class="delete" onclick="delFun(this)">
      <i class="fa fa-trash" style="font-size:large; color: red;"></i>
    </button>
  `;

  const heading = newdiv.querySelector("p");
  heading.style.textDecoration = data.check ? "line-through" : "none";

  if (data.check) {
    container.appendChild(newdiv);
  } else {
    container.insertBefore(newdiv, container.firstChild);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetch("/loadData", {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed: ${res.statusText}`);
      }
      return res.json();
    })
    .then((data) => {
      data.forEach((ele) => createDom(ele));
    })
    .catch((err) => {
      console.error("Error in fetching data: ", err);
    });
});

function editFun(e) {
  const para = e;
  const input = e.parentNode.querySelector(".texthidden");
  const checkbox = e.parentNode.querySelector(".checkbox");

  if (checkbox.checked) {
    alert("First uncheck the checkbox before editing.");
    return;
  }

  input.style.display = "inline-block";
  para.style.display = "none";
  input.value = para.innerText;

  input.focus();

  input.addEventListener("blur", () => {
    if (input.value.trim() == "") {
      alert("Please enter valid data.");
      input.value = para.innerText;
    } else {
      const newInput = input.value.trim();
      const obj = { id: e.parentNode.id, input: newInput };

      fetch("/editable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(obj)
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed: ${res.statusText}`);
          }
          return res.json();
        })
        .then(() => {
          para.innerText = newInput;
          para.style.display = "inline-block";
          input.style.display = "none";
        })
        .catch((err) => {
          console.error("Error in editing data: ", err);
        });
    }
  });
}

function moveToBottom(id) {
  const divData = document.getElementById(id);
  const task = divData.querySelector("p");
  task.style.textDecoration = "line-through";
  container.appendChild(divData);
}

function moveToTop(id) {
  const divData = document.getElementById(id);
  const task = divData.querySelector("p");
  task.style.textDecoration = "none";
  container.insertBefore(divData, container.firstChild);
}

function checkFun(e) {
  const isChecked = e.checked;
  const id = e.parentNode.id;
  const obj = { check: isChecked, DivId: id };

  fetch("/movement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj)
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed: ${res.statusText}`);
      }
      return res.json();
    })
    .then((data) => {
      if (data.check) {
        moveToBottom(id);
      } else {
        moveToTop(id);
      }
    })
    .catch((err) => {
      console.error("Error in updating checkbox: ", err);
    });
}

function delFun(e) {
  const id = e.parentNode.id;
  const obj = { DivId: id };

  fetch("/deleteData", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj)
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed: ${res.statusText}`);
      }
      return res.json();
    })
    .then(() => {
      const child = document.getElementById(id);
      // child.remove();
      child.parentElement.removeChild(child);
    })
    .catch((err) => {
      console.error("Error in deleting data: ", err);
    });
}

addbtn.addEventListener("click", () => {
  if (taskname.value.trim() == "") {
    alert("Please enter valid data.");
  } else {
    const obj = { task: taskname.value.trim() };

    fetch("/todo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(obj)
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        createDom(data);
      })
      .catch((err) => {
        console.error("Error in adding task: ", err);
      });

    taskname.value = "";
  }
});
