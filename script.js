// --- SCREEN HANDLING --------------------------

const LAUNCH_SCREEN_NAME = "launch-screen";
const PREDICT_SCREEN_NAME = "predict-screen";
const CONFIRM_SCREEN_NAME = "confirm-screen";
const FINAL_SCREEN_NAME = "final-screen";
const REVIEW_INPUT_SCREEN_NAME = "review-input-screen";
const REVIEW_SCREEN_NAME = "review-screen";

function set_screen(screen_name) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  })
  document.getElementById(screen_name).classList.add("active");
}

// --- DATA HANDLING ----------------------------

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

let outcomes_promise = get_data().then(data => data.outcomes);
async function get_outcomes() {
  return await outcomes_promise;
}

// --- REGULAR SEASON GET METHODS ---------------

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

// --- BRACKET OUTCOMES -------------------------

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

// --- PREDICTION QUEUE -------------------------

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

async function queue_next_play_in(conference_name) {
  let winner = null;
  let other_winner = null;
  let new_id = null;
  if (conference_name == "east") {
    new_id = "East Play-In Match 3";
  } else if (conference_name == "west") {
    new_id = "West Play-In Match 3";
  }

  if (conference_name == "east") {
    winner = get_matchup_winner("East Play-In Match 1");
    other_winner = get_matchup_winner("East Play-In Match 2");
  } else if (conference_name == "west") {
    winner = get_matchup_winner("West Play-In Match 1");
    other_winner = get_matchup_winner("West Play-In Match 2");
  }
  const seed_7 = await get_team_by_seed(conference_name, 7);
  const seed_8 = await get_team_by_seed(conference_name, 8);
  if (winner.abbr == seed_7.abbr) {
    enqueue_matchup(new_id, seed_8, other_winner, true);
  } else {
    enqueue_matchup(new_id, seed_7, other_winner, true);
  }
}

async function queue_round_1(conference_name) {
  const seed_1 = await get_team_by_seed(conference_name, 1);
  const seed_2 = await get_team_by_seed(conference_name, 2);
  const seed_3 = await get_team_by_seed(conference_name, 3);
  const seed_4 = await get_team_by_seed(conference_name, 4);
  const seed_5 = await get_team_by_seed(conference_name, 5);
  const seed_6 = await get_team_by_seed(conference_name, 6);

  let name_starter = null;
  let seed_7 = null;
  let seed_8 = null;
  if (conference_name == "east") {
    name_starter = "East Round 1";
    seed_7 = get_matchup_winner("East Play-In Match 1");
    seed_8 = get_matchup_winner("East Play-In Match 3");
  } else if (conference_name == "west") {
    name_starter = "West Round 1";
    seed_7 = get_matchup_winner("West Play-In Match 1");
    seed_8 = get_matchup_winner("West Play-In Match 3");
  } else {
    return;
  }

  enqueue_matchup(`${name_starter} Match 1`, seed_1, seed_8, false);
  enqueue_matchup(`${name_starter} Match 2`, seed_2, seed_7, false);
  enqueue_matchup(`${name_starter} Match 3`, seed_3, seed_6, false);
  enqueue_matchup(`${name_starter} Match 4`, seed_4, seed_5, false);
}

function queue_round_2(conference_name) {
  let name_starter = "";
  if (conference_name == "east") {
    name_starter = "East";
  } else if (conference_name == "west") {
    name_starter = "West";
  } else {
    return;
  }

  const team_1 = get_matchup_winner(`${name_starter} Round 1 Match 1`);
  const team_2 = get_matchup_winner(`${name_starter} Round 1 Match 2`);
  const team_3 = get_matchup_winner(`${name_starter} Round 1 Match 3`);
  const team_4 = get_matchup_winner(`${name_starter} Round 1 Match 4`);

  enqueue_matchup(`${name_starter} Round 2 Match 1`, team_1, team_4, false);
  enqueue_matchup(`${name_starter} Round 2 Match 2`, team_2, team_3, false);
}

function queue_round_3(conference_name) {
  let name_starter = "";
  if (conference_name == "east") {
    name_starter = "East";
  } else if (conference_name == "west") {
    name_starter = "West";
  } else {
    return;
  }

  const team_1 = get_matchup_winner(`${name_starter} Round 2 Match 1`);
  const team_2 = get_matchup_winner(`${name_starter} Round 2 Match 2`);

  enqueue_matchup(`${name_starter} Conference Finals`, team_1, team_2, false);
}

function queue_finals() {
  const west_team = get_matchup_winner("West Conference Finals");
  const east_team = get_matchup_winner("East Conference Finals");
  enqueue_matchup('Finals', west_team, east_team, false);
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

const team_1_box = document.getElementById("team-1");
const team_2_box = document.getElementById("team-2");

function clear_team_selection() {
  team_1_box.classList.remove("selected");
  team_2_box.classList.remove("selected");
  selection_made = false;
  selection = null;
}

const matchup_button = document.getElementById("matchup-button");
const games_input = document.getElementById("games-input");

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

const match_title = document.getElementById("predict-screen").querySelector(".title");

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

const games_slider = document.getElementById("games-slider");
const games_text = document.getElementById("games-text");

games_slider.oninput = function() {
  games_text.innerHTML = String(this.value) + " Games";
  games = this.value;
};

let finished_play_in = false;
let finished_r1 = false;
let finished_r2 = false;
let finished_r3 = false;
let finished_f = false;

function display_next_matchup() {
  const new_matchup = pop_matchup();
  display_matchup(new_matchup['id'], new_matchup['team_1'], new_matchup['team_2'], new_matchup['play_in']);
}

matchup_button.onclick = async function() {
  set_matchup_winner(matchup_id, selection, games);
  if (queue.length > 0) {
    display_next_matchup();
  } else {
    if (!finished_play_in) {
      await queue_next_play_in("west");
      await queue_next_play_in("east");
      finished_play_in = true;
      display_next_matchup();
    } else if (!finished_r1) {
      games = games_slider.value;
      games_text.innerHTML = String(games) + " Games";
      await queue_round_1("west");
      await queue_round_1("east");
      finished_r1 = true;
      display_next_matchup();
    } else if (!finished_r2) {
      queue_round_2("west");
      queue_round_2("east");
      finished_r2 = true;
      display_next_matchup();
    } else if (!finished_r3) {
      queue_round_3("west");
      queue_round_3("east");
      finished_r3 = true;
      display_next_matchup();
    } else if (!finished_f) {
      queue_finals();
      finished_f = true;
      display_next_matchup();
    } else {
      display_bracket();
      set_screen(FINAL_SCREEN_NAME);
    }
  }
};

// --- REVIEW SCREEN ----------------------------

const bracket_input = document.getElementById("bracket-input");
const bracket_input_return_button = document.getElementById("review-input-return-button");
const bracket_input_button = document.getElementById("review-confirm-button");

let bracket_winners = {};
let bracket_games = {};

function is_number(str) {
  return str.trim() !== "" && !isNaN(str);
}

function parse_line(line) {
  const elements = line.split(": ");
  if (elements.length != 2) {
    return;
  }

  const subelements = elements[1].split(" ");
  if (subelements.length != 1 && subelements.length != 3) {
    return;
  }
  if (subelements.length == 3 && subelements[1] != "in") {
    return;
  }

  if (subelements.length == 3 && !is_number(subelements[2])) {
    return;
  }

  const key = elements[0];
  const winner = subelements[0];
  let games = -1;
  if (subelements.length == 3) {
    games = Number(subelements[2]);
  }

  bracket_winners[key] = winner;
  bracket_games[key] = games;
}

function clear_bracket() {
  for (const id in bracket_winners) delete bracket_winners[id];
  for (const id in bracket_games) delete bracket_games[id];
}

function parse_bracket(bracket_text) {
  clear_bracket();

  const lines = bracket_text.split(/\r?\n/);
  for (const line of lines) {
    parse_line(line);
  }
}

const score_display = document.getElementById("bracket-score");

function set_score(score) {
  if (score == 1) {
    score_display.innerHTML = `Score: ${score} Point`;
  } else {
    score_display.innerHTML = `Score: ${score} Points`;
  }
}

const bracket_list = document.getElementById("bracket-list");

function add_bracket_item(title, value) {
  const item_div = document.createElement("div");
  item_div.classList.add("list-item");

  const title_div = document.createElement("div");
  title_div.classList.add("list-title");
  title_div.innerHTML = title;
  
  const value_div = document.createElement("div");
  value_div.classList.add("list-value");
  value_div.innerHTML = value;

  item_div.appendChild(title_div);
  item_div.appendChild(value_div);

  bracket_list.appendChild(item_div);
}

function clear_bracket_items() {
  bracket_list.innerHTML = "";
}

async function display_review() {
  let score = 0;
  clear_bracket_items();

  const outcomes = await get_outcomes();
  for (const id of Object.keys(outcomes)) {
    const winner = outcomes[id].winner;
    const games = outcomes[id].games;

    let base_string = `${id}: ${winner}`
    if (games != -1) {
      base_string += ` in ${games}`
    }

    if (bracket_winners[id]) {
      let pick_string = `Your pick: ${bracket_winners[id]}`;
      if (games != -1) {
        pick_string += ` in ${bracket_games[id]}`
      }

      if (winner == bracket_winners[id]) {
        if (games != -1) {
          if (games == bracket_games[id]) {
            add_bracket_item(`✅✅ ${base_string} (${pick_string})`, "+2");
            score += 2;
          } else {
            add_bracket_item(` ✅ ${base_string} (${pick_string})`, "+1");
            score += 1;
          }
        } else {
          add_bracket_item(` ✅ ${base_string} (${pick_string})`, "+1");
          score += 1;
        }
      } else {
        add_bracket_item(` ❌ ${base_string} (${pick_string})`, "-");
      }
    } else {
      // No prediction made
      add_bracket_item(` ❌ ${base_string} (No pick made)`, "-");
    }
  }

  set_score(score);
}

bracket_input_return_button.onclick = function() {
  set_screen(LAUNCH_SCREEN_NAME);
}

bracket_input_button.onclick = async function() {
  parse_bracket(bracket_input.value);
  await display_review();
  set_screen(REVIEW_SCREEN_NAME);
}

const review_home_button = document.getElementById("review-home-button");
const review_redo_button = document.getElementById("review-redo-button");

review_home_button.onclick = function() {
  set_screen(LAUNCH_SCREEN_NAME);
}

review_redo_button.onclick = function() {
  clear_bracket();
  set_screen(REVIEW_INPUT_SCREEN_NAME);
}

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

const create_button = document.getElementById("create-button");
const review_button = document.getElementById("review-button");

create_button.onclick = launch;
review_button.onclick = function() {
  set_screen(REVIEW_INPUT_SCREEN_NAME);
};

// --- INITIALIZE SITE --------------------------

set_screen(LAUNCH_SCREEN_NAME);