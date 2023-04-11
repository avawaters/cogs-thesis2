// load jsPsych
var jsPsych = initJsPsych({});

// timeline that holds javascript variables
var timeline = [];

// capture info from Prolific
const subject_id = jsPsych.data.getURLVariable('PROLIFIC_PID');
const fname = `${subject_id}.json`;

// STIMULI FILES
// array of arrays of arrays, where the first array holds predictable melodies,
//                            and the second holds unpredictable melodies.
//                            within each of those arrays, the first element contains the seed 1 melodies,
//                            the second element contains the seed 2 melodies,
//                            the third element contains the seed 3 melodies,
//                            and the fourth element contains the seed 4 melodies
// TO ACCESS ONE FILE: all_stimuli[pred][seed][range]
all_stimuli = [[["stimuli/high/seed_1p-high.mp3", "stimuli/low/seed_1p-low.mp3"],
    ["stimuli/high/seed_2p-high.mp3", "stimuli/low/seed_2p-low.mp3"],
    ["stimuli/high/seed_3p-high.mp3", "stimuli/low/seed_3p-low.mp3"],
    ["stimuli/high/seed_4p-high.mp3", "stimuli/low/seed_4p-low.mp3"]],
    [["stimuli/high/seed_1u-high.mp3", "stimuli/low/seed_1u-low.mp3"],
    ["stimuli/high/seed_2u-high.mp3", "stimuli/low/seed_2u-low.mp3"], 
    ["stimuli/high/seed_3u-high.mp3", "stimuli/low/seed_3u-low.mp3"], 
    ["stimuli/high/seed_4u-high.mp3", "stimuli/low/seed_4u-low.mp3"]]]

function select_stimuli() {
    // EACH ARRAY HAS 8 ELEMENTS CHARACTERIZING EACH OF THE 8 STIMULI
    // array to determine which version is presented first, with 0 = predictable, 1 = unpredictable
    pred_order = jsPsych.randomization.sampleWithReplacement([0, 1], 4)
    pred_complement = pred_order.map((n) => Math.abs(n - 1))
    // counterbalance predictability order
    pred_order = pred_order.concat(pred_complement)

    // array to determine the order in which seed melodies are presented
    melody_order = jsPsych.randomization.sampleWithoutReplacement([0, 1, 2, 3], 4)
    // counterbalance melody presentation order
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
    //DEBUG
    console.log(stimuli);
}

// return the melody version as "p" or "u"
function get_version(s) {
    pred = s.split('_')[1][1]
    return pred
}

// return the melody number (not including prefix "seed_")
function get_melody(s) {
    mel = s.split('_')[1][0]
    return mel
}

// return the range (0 = high, 1 = low)
function get_range(s) {
    r = s.split('-')[1].split('.')[0]
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
    stimulus: "<p>In this experiment, you are asked to listen to and rate 8 melodies.</p><p>Please rate each melody based on how much you like it. Each melody will be played once and can be played up to three times.</p>To continue, hit the 'Next' button.",
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
            prompt: "Have you taken music lessons or music theory classes?",
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
            prompt: "Do you currently take lessons or classes?",
            name: "LessonCurrent",
            options: ["Yes", "No"],
            required: true
        }
    ]
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
var times_played = 1;

var play_melody = {
    type: jsPsychAudioButtonResponse,
    stimulus: jsPsych.timelineVariable("file"),
    prompt: "<img src='images/notes.png'></img>",
    choices: ["Replay", "Rate"],
    response_allowed_while_playing: false
} 

// allow replay if participant clicks replay button and they've heard < 3 times
var conditional_replay_melody = {
    timeline: [play_melody],
    loop_function: function(data){
        if (jsPsych.data.get().last(1).values()[0].response == 1) {
            return false;
        } else if (times_played > 2) {
            return false
        } else {
            ++times_played;
            return true;
        }
    }
}

var rate_melody = {
    type: jsPsychSurveyLikert,
    questions: [
        {
            prompt: "How much do you enjoy this melody?",
            labels: ["1\n(not at all)", "2", "3", "4", "5", "6", "7\n(very much)"],
            required: true
        }
    ],
    data: {
        task: "rate",
        version: jsPsych.timelineVariable("version"),
        melody: jsPsych.timelineVariable("melody"),
        range: jsPsych.timelineVariable("range"),
        n_plays: function () { return times_played }
    }
};

var trial_intermission = {
    type: jsPsychHtmlButtonResponse,
    stimulus: "Click the button to continue to the next melody.",
    choices: ["Next"],
    // reset for next melody
    on_finish: function() { times_played = 1}
};

// determine when to display intermission (trials 1-7)
var conditional_intermission = {
    timeline: [trial_intermission],
    conditional_function: function () {
        return (jsPsych.data.get().filter({task: "rate"}).count() < 8);
    }
};

// save data
const save_data = {
    type: jsPsychPipe,
    action: "save",
    experiment_id: "lCdmw0LCrwtj",
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
    timeline: [conditional_replay_melody, rate_melody, conditional_intermission, conditional_save_data],
    timeline_variables: [
        {
            "file": function () { return stimuli[0] },
            "version": function() { return get_version(stimuli[0]) },
            "melody": function () { return get_melody(stimuli[0]) },
            "range": function() { return get_range(stimuli[0])}
        },
        {
            "file": function () { return stimuli[1] },
            "version": function() { return get_version(stimuli[1]) },
            "melody": function () { return get_melody(stimuli[1]) },
            "range": function() { return get_range(stimuli[1])}
        },
        {
            "file": function () { return stimuli[2] },
            "version": function() { return get_version(stimuli[2]) },
            "melody": function () { return get_melody(stimuli[2]) },
            "range": function() { return get_range(stimuli[2])}
        },
        {
            "file": function () { return stimuli[3] },
            "version": function() { return get_version(stimuli[3]) },
            "melody": function () { return get_melody(stimuli[3]) },
            "range": function() { return get_range(stimuli[3])}
        },
        {
            "file": function () { return stimuli[4] },
            "version": function() { return get_version(stimuli[4]) },
            "melody": function () { return get_melody(stimuli[4]) },
            "range": function() { return get_range(stimuli[4])}
        },
        {
            "file": function () { return stimuli[5] },
            "version": function() { return get_version(stimuli[5]) },
            "melody": function () { return get_melody(stimuli[5]) },
            "range": function() { return get_range(stimuli[5])}
        },
        {
            "file": function () { return stimuli[6] },
            "version": function() { return get_version(stimuli[6]) },
            "melody": function () { return get_melody(stimuli[6]) },
            "range": function() { return get_range(stimuli[6])}
        },
        {
            "file": function () { return stimuli[7] },
            "version": function() { return get_version(stimuli[7]) },
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
            window.location.href = "https://app.prolific.co/submissions/complete?cc=C14MF51X";
        }
    }
};

// give detailed debriefing to participant
var full_debrief = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<p>This experiment is exploring the relationship between melodic predictability and listener pleasure. You are a part of the group that is rating these melodies. As you may have noticed, there are four pairs of melodies that have the same beginning. These melodies were continued and finished by other participants who sung what note they thought came next. Their responses generated most of what you heard. At one point in each melody, there is one version that continued with the most predictable note and one version that continued with an unpredictable note. These two mutations of the melodies were then developed in parallel. As you heard both versions of all four melodies, your ratings will be used to investigate if predictability affects how much you enjoy them. </p><a href='https://app.prolific.co/submissions/complete?cc=C14MF51X'>CLICK HERE</a> to return to Prolific and complete the study.",
    choices: "NO_KEYS"
};

var conditional_full_debrief = {
    timeline: [full_debrief],
    conditional_function: function () {
        return (jsPsych.data.get().last(1).values()[0].response == 0);
    }
}

timeline.push(debrief, conditional_full_debrief);

jsPsych.run(timeline);
