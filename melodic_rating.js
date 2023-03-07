// load jsPsych
var jsPsych = initJsPsych({});

// timeline that holds javascript variables
var timeline = [];

// capture info from Prolific
//const subject_id = jsPsych.data.getURLVariable('PROLIFIC_PID');
const subject_id = jsPsych.randomization.randomID(10);
const fname = `rate-${subject_id}.json`;

// STIMULI FILES
// array of arrays of arrays, where the first array holds predictable melodies,
//                            and the second holds unpredictable melodies.
//                            within each of those arrays, the first element contains the seed 1 melodies,
//                            the second element contains the seed 2 melodies,
//                            the third element contains the seed 3 melodies,
//                            and the fourth element contains the seed 4 melodies
// TO ACCESS ONE FILE: all_stimuli[pred][seed][range]
all_stimuli = [[["stimuli/high/gen_9/seed_1p-gen9-high.mp3", "stimuli/low/gen_9/seed_1p-gen9-low.mp3"],
    ["stimuli/high/gen_9/seed_2p-gen9-high.mp3", "stimuli/low/gen_9/seed_2p-gen9-low.mp3"],
    ["stimuli/high/gen_9/seed_3p-gen9-high.mp3", "stimuli/low/gen_9/seed_3p-gen9-low.mp3"],
    ["stimuli/high/gen_9/seed_4p-gen9-high.mp3", "stimuli/low/gen_9/seed_4p-gen9-low.mp3"]],
    [["stimuli/high/gen_9/seed_1u-gen9-high.mp3", "stimuli/low/gen_9/seed_1u-gen9-low.mp3"],
    ["stimuli/high/gen_9/seed_2u-gen9-high.mp3", "stimuli/low/gen_9/seed_2u-gen9-low.mp3"], 
    ["stimuli/high/gen_9/seed_3u-gen9-high.mp3", "stimuli/low/gen_9/seed_3u-gen9-low.mp3"], 
    ["stimuli/high/gen_9/seed_4u-gen9-high.mp3", "stimuli/low/gen_9/seed_4u-gen9-low.mp3"]]]

function select_stimuli() {
    // EACH ARRAY HAS 8 ELEMENTS CHARACTERIZING EACH OF THE 8 STIMULI
    // array to determine which version is presented first, with 0 = predictable, 1 = unpredictable
    pred_order = jsPsych.randomization.sampleWithReplacement([0, 1], 4)
    pred_complement = pred_order.map((n) => Math.abs(n - 1))
    // balanced so both versions are played
    pred_order = pred_order.concat(pred_complement)

    // array to determine the order in which seed melodies are presented
    melody_order = jsPsych.randomization.sampleWithoutReplacement([0, 1, 2, 3], 4)
    // balanced so there are 3 melodies before repeating the seed
    melody_order = melody_order.concat(melody_order)

    // array to determine what range the melody is played in with 0 = higher, 1 = lower
    ranges = jsPsych.randomization.sampleWithReplacement([0, 1], 8)
    
    // array to hold stimuli
    stimuli = []

    // select 8 melodies
    for (let i = 0; i < 8; i++) {
        melody = all_stimuli[pred_order[i]][melody_order[i]][ranges[i]]
        stimuli.push(melody)
    }
}

function get_pred(s) {
    pred = s.split('-')[0].split('/')[3][6]
    // return 0 if predictable, 1 if unpredictable
    if (pred == "p") {
        return 0
    }
    else { return 1 }
}

function get_melody(s) {
    return s.split('-')[0].split('/')[3][5]
}

function get_range(s) {
    r = s.split('-')[2].split('.')[0]
    // return 0 if high, 1 if low
    if (r == "high") {
        return 0
    }
    else { return 1 }
}

select_stimuli()

/**************************************** EXPERIMENT EVENTS ****************************************/
var preload = {
    type: jsPsychPreload,
    auto_preload: true
};

var welcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<p style='font-size:68px;'>Welcome!</p>",
    choices: "NO_KEYS",
    trial_duration: 1500
};

timeline.push(welcome);

var instructions = {
    type: jsPsychHtmlButtonResponse,
    stimulus: "<p>In this experiment, you will be asked to listen to and rate 8 melodies.</p>><p>Please rate each melody based on how much you like it. Each melody will be played once, and can be played up to three times.</p>To continue, hit the 'Next' button'.",
    choices: ["Next"]
};

var housekeeping = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "Now for some housekeeping...",
    choices: "NO_KEYS",
    trial_duration: 2000,
};

timeline.push(instructions, housekeeping);

// adjust volume
var volume_calibration = {
    type: jsPsychAudioButtonResponse,
    stimulus: "stimuli/volume_cal.mp3",
    prompt: "<p>As you hear the music, please adjust your volume to a comfortable level.</p>Click the button to continue.",
    choices: ["Continue"],
};

timeline.push(volume_calibration);

// collect info about musical training experience
var lessons_q = {
    type: jsPsychSurveyMultiChoice,
    questions: [
        {
            prompt: "Have you taken music lessons?",
            options: ["No", "Yes"],
            required: true,
            horizontal: true
        },
    ]
};

var lessons_cont_qs = {
    type: jsPsychSurveyMultiChoice,
    questions: [
        {
            prompt: "For how many years?",
            name: "LessonYears",
            options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"],
            required: true
        },
        {
            prompt: "Do you currently take lessons?",
            name: "LessonCurrent",
            options: ["Yes", "No"],
            required: true
        }
    ],
};

var conditional_qs = {
    timeline: [lessons_cont_qs],
    conditional_function: function () {
        return (jsPsych.data.get().last(1).values()[0].response.Q0 == 'Yes');
    }
};

timeline.push(lessons_q, conditional_qs);

var start_experiment = {
    type: jsPsychHtmlButtonResponse,
    stimulus: "When you are ready to move begin the experiment, click the 'Start' button.",
    choices: ["Start"]
}

timeline.push(start_experiment);

// PROCEDURE EVENTS
// count number of times melody has been played (can't exceed 3)
var times_played = 0;

var play_melody = {
    type: jsPsychAudioButtonResponse,
    stimulus: jsPsych.timelineVariable("file"),
    prompt: "<img src='images/notes.png'></img>",
    choices: ["Replay", "Rate"],
    response_allowed_while_played: false,
    on_finish: function (data) {
        times_played++;
    }
}

var conditional_repeat_melody = {
    timeline: [play_melody],
    loop_function: function(data){
        if ((times_played < 3) && (jsPsych.data.get().last(1).values()[0].response == 0)) {
            return true;
        } else {
            return false;
        }
    }
}

var rate_melody = {
    type: jsPsychSurveyLikert,
    questions: [
        {
            prompt: "On a scale of 1-7, how much did you enjoy this melody?",
            labels: ["1\n(not at all)", "2", "3", "4", "5", "6", "7\n(really like it)"],
            required: true
        }
    ],
    data: {
        task: "rate",
        pred: jsPsych.timelineVariable("pred"),
        melody: jsPsych.timelineVariable("melody"),
        range: jsPsych.timelineVariable("range"),
        n_plays: times_played
    },
    on_finish: function () {
        // reset for next melody
        times_played = 0
    }
};

var trial_intermission = {
    type: jsPsychHtmlButtonResponse,
    stimulus: "Click the button to continue to the next melody.",
    choices: ["Next"]
};

// determine when to display intermission (trials 1-7)
var conditional_intermission = {
    timeline: [trial_intermission],
    conditional_function: function () {
        // Determine if the subject is on the last melody 
        return (jsPsych.data.get().filter({task: "rate"}).count() < 8);
    }
};

// save data
const save_data = {
    type: jsPsychPipe,
    action: "save",
    experiment_id: "QfKXr6jPLyzT",
    filename: fname,
    data_string: ()=>jsPsych.data.get().json()
  };

// determine when to save data (after all 8 trials)
var conditional_save_data = {
    timeline: [save_data],
    conditional_function: function () {
        return (jsPsych.data.get().filter({task: "rate"}).count() == 8);
    }
};

// run experimental trials
var listen_and_respond_procedure = {
    timeline: [play_melody, conditional_repeat_melody, rate_melody, conditional_intermission, conditional_save_data ],
    timeline_variables: [
        {
            "file": function () { return stimuli[0] },
            "pred": function() { return get_pred(stimuli[0]) },
            "melody": function () { return get_melody(stimuli[0]) },
            "range": function() { return get_range(stimuli[0])}
        },
        {
            "file": function () { return stimuli[1] },
            "pred": function() { return get_pred(stimuli[1]) },
            "melody": function () { return get_melody(stimuli[1]) },
            "range": function() { return get_range(stimuli[1])}
        },
        {
            "file": function () { return stimuli[2] },
            "pred": function() { return get_pred(stimuli[2]) },
            "melody": function () { return get_melody(stimuli[2]) },
            "range": function() { return get_range(stimuli[2])}
        },
        {
            "file": function () { return stimuli[3] },
            "pred": function() { return get_pred(stimuli[3]) },
            "melody": function () { return get_melody(stimuli[3]) },
            "range": function() { return get_range(stimuli[3])}
        },
        {
            "file": function () { return stimuli[4] },
            "pred": function() { return get_pred(stimuli[4]) },
            "melody": function () { return get_melody(stimuli[4]) },
            "range": function() { return get_range(stimuli[4])}
        },
        {
            "file": function () { return stimuli[5] },
            "pred": function() { return get_pred(stimuli[5]) },
            "melody": function () { return get_melody(stimuli[5]) },
            "range": function() { return get_range(stimuli[5])}
        },
        {
            "file": function () { return stimuli[6] },
            "pred": function() { return get_pred(stimuli[6]) },
            "melody": function () { return get_melody(stimuli[6]) },
            "range": function() { return get_range(stimuli[6])}
        },
        {
            "file": function () { return stimuli[7] },
            "pred": function() { return get_pred(stimuli[7]) },
            "melody": function () { return get_melody(stimuli[7]) },
            "range": function() { return get_range(stimuli[7])}
        }
    ]
};

timeline.push(listen_and_respond_procedure);

// debrief the participant at the end of the experiment
var debrief = {
    type: jsPsychHtmlButtonResponse,
    stimulus: "<p>Thanks for participating in my experiment!</p>If you would like to learn more about it, click the 'Tell Me More!' button.<p>Otherwise, click the 'Back to Prolific' button to complete the study.</p>",
    choices: ["Tell Me More!", "Back to Prolific"],
    // Get button selected
    on_finish: function (data) {
        if (data.response == 1) {
            window.location.href = "https://www.vassar.edu/";
        }
    }
};

// give detailed debriefing to participant
var full_debrief = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<p>This experiment is exploring the relationship between melodic predictability and listener pleasure. You are a part of the group that is rating these melodies. As you may have noticed, there are four pairs of melodies that have the same beginning. These melodies were continued and finished by other participants who sung what note they thought came next. Their responses generated most of what you heard. At one point in each melody, there is one version that continued with the most predictable note and one version that continued with an unpredictable note. These two mutations of the melodies were developed in parallel. As you heard both versions of all four melodies, your ratings will be used to investigate if predictability affects how much you enjoyed them. </p><a href='https://www.vassar.edu/'>CLICK HERE</a> to return to Prolific and complete the study.",
    choices: "NO_KEYS"
};

var conditional_full_debrief = {
    timeline: [full_debrief],
    conditional_function: function () {
        return (jsPsych.data.get().last(1).values()[0].response.Q0 == 0);
    }
}

timeline.push(debrief, conditional_full_debrief);

//jsPsych.run(timeline);
