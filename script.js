const LAUNCH_SCREEN_NAME = "launch-screen";
const PREDICT_SCREEN_NAME = "predict-screen";
const CONFIRM_SCREEN_NAME = "confirm-screen";
const FINAL_SCREEN_NAME = "final-screen";

const container = document.getElementById("container");

function set_screen(screen_name) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  })
  document.getElementById(screen_name).classList.add("active");
}

function get_data() {
  return fetch("data.json").then(res => {
    return res.json().then(data => {
      return data;
    }).catch(error => {
      console.error(error);
    });
  });
};

let standings = {};
get_data().then(data => {
  standings = data["standings"];
});

set_screen(LAUNCH_SCREEN_NAME)