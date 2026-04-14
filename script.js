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

// --- MATCHUP OUTCOMES -------------------------

let matchup_winners = {};
let matchup_games = {};

function get_matchup_winner(matchup_id) {
  return matchup_winners[matchup_id];
}

function get_matchup_games(matchup_id) {
  return matchup_games[matchup_id];
}

function set_matchup_winner(matchup_id, team, games) {
  matchup_winners[matchup_id] = team;
  matchup_games[matchup_id] = games;
}

// --- QUEUE FOR PREDICTIONS --------------------

let queue = [];

function enqueue_matchup(id, team_1_obj, team_2_obj, play_in) {
  let matchup = {};
  matchup['id'] = id;
  matchup['team_1'] = team_1_obj;
  matchup['team_2'] = team_2_obj;
  matchup['play_in'] = play_in;
  queue.push(matchup);
}

function pop_matchup() {
  return queue.shift();
}

async function queue_play_in(conference_name) {
  const seed_7 = await get_team_by_seed(conference_name, 7);
  const seed_8 = await get_team_by_seed(conference_name, 8);
  const seed_9 = await get_team_by_seed(conference_name, 9);
  const seed_10 = await get_team_by_seed(conference_name, 10);

  if (conference_name === "east") {
    enqueue_matchup("East Play-In Match 1", seed_7, seed_8, true);
    enqueue_matchup("East Play-In Match 2", seed_9, seed_10, true);
  } else if (conference_name === "west") {
    enqueue_matchup("West Play-In Match 1", seed_7, seed_8, true);
    enqueue_matchup("West Play-In Match 2", seed_9, seed_10, true);
  }
}

// --- FINAL SCREEN -----------------------------

const bracket_display = document.getElementById("bracket-result");
let copypaste = "";

function display_bracket() {
  bracket_display.innerHTML = "";
  copypaste = "";
  for (key in matchup_winners) {
    const winner = get_matchup_winner(key).abbr;
    const games = get_matchup_games(key);
    if (games == -1) {
      bracket_display.innerHTML += `${key}: ${winner}<br>`;
      copypaste += `${key}: ${winner}\n`;
    } else {
      bracket_display.innerHTML += `${key}: ${winner} in ${games}<br>`;
      copypaste += `${key}: ${winner} in ${games}\n`;
    }
  }
}

document.getElementById("copy-button").onclick = function() {
  navigator.clipboard.writeText(copypaste);
};
document.getElementById("return-button").onclick = function() {
  set_screen(LAUNCH_SCREEN_NAME);
};

// --- PREDICT SCREEN ---------------------------

let matchup_id = "";

let team_1 = null;
let team_2 = null;
let games = -1;

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
  matchup_id = title;

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
  games = this.value;
};

matchup_button.onclick = function() {
  set_matchup_winner(matchup_id, selection, games);
  if (queue.length > 0) {
    const new_matchup = pop_matchup();
    display_matchup(new_matchup['id'], new_matchup['team_1'], new_matchup['team_2'], new_matchup['play_in']);
  } else {
    display_bracket();
    set_screen(FINAL_SCREEN_NAME);
  }
};

// --- LAUNCH SCREEN ----------------------------

async function launch() {
  for (const id in matchup_winners) {
    delete matchup_winners[id];
    delete matchup_games[id];
  }

  await queue_play_in("west");
  await queue_play_in("east");

  const first_match = pop_matchup();
  display_matchup(first_match['id'], first_match['team_1'], first_match['team_2'], first_match['play_in']);

  set_screen(PREDICT_SCREEN_NAME);
}

create_button.onclick = launch;

// --- INITIALIZE SITE --------------------------

set_screen(LAUNCH_SCREEN_NAME);