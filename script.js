const LAUNCH_SCREEN_NAME = "launch-screen";
const PREDICT_SCREEN_NAME = "predict-screen";
const CONFIRM_SCREEN_NAME = "confirm-screen";
const FINAL_SCREEN_NAME = "final-screen";

const create_button = document.getElementById("create-button");
const matchup_button = document.getElementById("matchup-button");

const match_title = document.getElementById("predict-screen").querySelector(".title");
const team_1_box = document.getElementById("team-1");
const team_2_box = document.getElementById("team-2");
const games_input = document.getElementById("games-input");
const games_slider = document.getElementById("games-slider");
const games_text = document.getElementById("games-text");

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

let standings_promise = get_data().then(data => data.standings);

async function get_standings() {
  return await standings_promise;
}

async function get_team_by_abbr(abbr) {
  const standings = await get_standings();
  for (const team of standings["east"]) {
    if (team.abbr == abbr) {
      return team;
    }
  }
  for (const team of standings["west"]) {
    if (team.abbr == abbr) {
      return team;
    }
  }
  return undefined;
}

async function get_team_by_seed(conference_name, seed) {
  const standings = await get_standings();
  const conference = standings[conference_name];
  for (const team of conference) {
    if (team.seed == seed) {
      return team;
    }
  }
  return undefined;
};

// --- PREDICT SCREEN ---------------------------

let team_1 = null;
let team_2 = null;

let selection_made = false;
let selection = null;

let play_in_match = false;

function clear_team_selection() {
  team_1_box.classList.remove("selected");
  team_2_box.classList.remove("selected");
  selection_made = false;
  selection = null;
}

team_1_box.addEventListener("click", () => {
  clear_team_selection();
  team_1_box.classList.add("selected");
  selection_made = true;
  selection = team_1;
  if (!play_in_match) {
    games_input.hidden = false;
  }
  matchup_button.hidden = false;
});

team_2_box.addEventListener("click", () => {
  clear_team_selection();
  team_2_box.classList.add("selected");
  selection_made = true;
  selection = team_2;
  if (!play_in_match) {
    games_input.hidden = false;
  }
  matchup_button.hidden = false;
});

function display_matchup(title, team_1_obj, team_2_obj, play_in) {
  match_title.innerHTML = title;

  clear_team_selection();
  games_input.hidden = true;
  matchup_button.hidden = true;

  play_in_match = play_in;

  team_1 = team_1_obj;
  team_2 = team_2_obj;

  team_1_box.querySelector(".team-name").innerHTML = team_1_obj.name;
  team_1_box.querySelector(".team-logo").src = team_1_obj.logo;
  team_1_box.querySelector(".team-record").innerHTML = team_1_obj.record;

  team_2_box.querySelector(".team-name").innerHTML = team_2_obj.name;
  team_2_box.querySelector(".team-logo").src = team_2_obj.logo;
  team_2_box.querySelector(".team-record").innerHTML = team_2_obj.record;
}

games_slider.oninput = function() {
  games_text.innerHTML = String(this.value) + " Games";
};

// --- LAUNCH SCREEN ----------------------------

async function launch() {
  set_screen(PREDICT_SCREEN_NAME);
}

create_button.onclick = launch;

// --- INITIALIZE SITE --------------------------

set_screen(LAUNCH_SCREEN_NAME);

//set_screen(PREDICT_SCREEN_NAME);
