var socket;
var qid = null;
var sqid = null;
var questions = [];

function get_question(id) {
    for(question of questions)
        if(question.id == id)
            return question
    return null;
}

function connect() {
    socket = new WebSocket("ws://192.168.2.95:8765");

    socket.onopen = function(e) {
        console.log("Connected to socket!");
        $(document).ready(function() {
            $("#offline").hide();
            $("#question").hide();
            $("#no-question").hide();
            $("#verify-identity").show();
            $("#home").hide();
            $("#change-topic").hide();
            $("#reset-topic").hide();
            $("#stats-topic").hide();
            $("#stats-view").hide();
            $("#online").show();
        });
        if(voting)
            socket.send("VOTER");
        else
            socket.send("ADMIN");
    };

    socket.onmessage = function(e) {
        $(document).ready(function() {
            let response = e.data;
            let args = response.split("|||");
            console.log(args);
            if(args[0] == "700") {
                $("#verify-identity-error-text").html("Invalid Voter Access Code");
                $("#verify-identity-loading").hide();
                $("#verify-identity-fields").show();
            } else if(args[0] == "709" || args[0] == "710") {
                $("#verify-identity-error-text").html("You are already connected on another device");
                $("#verify-identity-loading").hide();
                $("#verify-identity-fields").show();
            } else if(args[0] == "800") {
                $("#verify-identity").hide();
                let name = args[1];
                $(".voting-as").html("Voting as " + name);
            } else if(args[0] == "NEW") {
                if(voting) {
                    // Handle voter actions
                    if(args[1] == "NONE") {
                        $("#question").hide();
                        $("#no-question").show();
                        qid = null;
                    } else {
                        qargs = args[1].split("%%");
                        qid = qargs[0];
                        let already_voted = args[2];
                        $("#question-text small").html(qargs[1]);
                        $("#vote-loading").hide();
                        if(already_voted == "True") {
                            $("#question-options").hide();
                            $("#vote-receieved").show();
                        } else {
                            // Add custom options right here
                            $("#button-options").html("");
                            let new_html = "";
                            let qoptions = [];
                            if(qargs.length > 2)
                                qoptions = qargs.slice(2, qargs.length);
                            console.log("DAMN:" + qoptions);
                            for(var i = 0; i < qoptions.length; i++) {
                                option = qoptions[i];
                                new_html += '<button class="btn btn-outline-info mt-1 ml-1 mr-1" onclick="vote(\'' + option + '\')">' + option + '</button>';
                            }
                            $("#button-options").html(new_html);
                            $("#vote-receieved").hide();
                            $("#question-options").show();
                        }
                        $("#no-question").hide();
                        $("#question").show();
                    }
                } else {
                    // Handle admin actions
                    if(args[1] == "NONE") {
                        $("#clear-topic-button").hide();
                        $(".cur-question small").html("There is no active topic right now");
                        qid = null;
                    } else {
                        $("#clear-topic-button").show();
                        let qargs = args[1].split("%%");
                        qid = qargs[0];
                        let question = qargs[1];
                        $(".cur-question small").html("Current topic: " + question);
                    }
                }
            } else if(args[0] == "801" || args[0] == "705" || args[0] == "706" || args[0] == "707" || args[0] == "708") {
                $("#vote-loading").hide();
                $("#vote-receieved").show();
            } else if(args[0] == "805") {
                $("#verify-identity").hide();
                let name = args[1];
                $(".admin-as").html("Hello " + name + "!");
                $("#home").show();
            } else if(args[0] == "701") {
                $("#verify-identity-error-text").html("Invalid Admin Access Code");
                $("#verify-identity-loading").hide();
                $("#verify-identity-fields").show();
            } else if(args[0] == "REG") {
                let qargs = args[1].split("%%");
                let sargs = args[2].split("%%");
                let qoptions = [];
                if(qargs.length > 2)
                    qoptions = qargs.slice(2, qargs.length);

                questions.push({
                    id: qargs[0],
                    text: qargs[1],
                    options: qoptions,
                    stats: sargs
                });
                console.log(questions);
                let new_change_html = "<div class='row mt-2'><button onclick='change_topic(" + qargs[0] + ")' class='btn btn-outline-primary ml-auto mr-auto'>" + qargs[1] + "</button></div>";
                $("#change-topic-options").html($("#change-topic-options").html() + new_change_html);
                let new_reset_html = "<div class='row mt-2'><button onclick='reset_topic(" + qargs[0] + ")' class='btn btn-outline-success ml-auto mr-auto'>" + qargs[1] + "</button></div>";
                $("#reset-topic-options").html($("#reset-topic-options").html() + new_reset_html);
                let new_stats_html = "<div class='row mt-2'><button onclick='stats_topic(" + qargs[0] + ")' class='btn btn-outline-warning ml-auto mr-auto'>" + qargs[1] + "</button></div>";
                $("#stats-topic-options").html($("#stats-topic-options").html() + new_stats_html);
            } else if(args[0] == "804") {
                $("#reset-home-button").show();
                $("#reset-topic-loading").hide();
                $("#reset-topic-success").show();
            } else if(args[0] == "704") {
                $("#reset-home-button").show();
                $("#reset-topic-loading").hide();
                $("#reset-topic-failure").show();
            } else if(args[0] == "STATS") {
                let qargs = args[1].split("%%");
                let sargs = args[2].split("%%");

                let question = get_question(qargs[0]);
                question.stats = sargs;
                if(question.id == sqid) {
                    if(question.stats.length > 3) {
                        let custom_stats = question.stats.slice(0, question.stats.length-3);
                        for(var i = 0; i < custom_stats.length; i++) {
                            let option = question.options[i];
                            let stat = custom_stats[i];
                            $("#stats-" + i).html(stat);
                        }
                    }
                    $("#did-not-vote-text").html(question.stats[question.stats.length-3] + " did not vote");
                    $("#total-voters-text").html(question.stats[question.stats.length-2] + " vote(s)");
                    $("#participation-text").html(question.stats[question.stats.length-1] + "% participation");
                }
            } else if(args[0] == "ONLINE") {
                $("#voters-online").html(args[1] + " voter(s) online");
            }
        });
    };

    socket.onclose = function(e) {
        $(document).ready(function() {
            $("#online").hide();
            $("#offline").show();
            $("#verify-identity-error-text").html("");
            $("#verify-identity-loading").hide();
            $("#verify-identity-fields").show();
        });
        console.log("[SOCKET ERROR] Could not connect to socket. Retrying in 1 second...");
        setTimeout(function() {
            connect();
        }, 1000);
    };

    socket.onerror = function(e) {
        console.log("[SOCKET ERROR] " + e.message);
    };
}

function change_topic(id) {
    $(document).ready(function() {
        socket.send("CUR-" + id);
        $("#change-topic").hide();
        $("#home").show();
    });
}

function reset_topic(id) {
    $(document).ready(function() {
        $("#reset-topic-options").hide();
        $("#reset-home-button").hide();
        $("#reset-topic-loading").show();
        socket.send("RESET-" + id);
    });
}

function stats_topic(id) {
    $(document).ready(function() {
        sqid = id;
        let question = get_question(id);
        $(".stats-view-question small").html(question.text);
        $("#response-area").html("");
        var new_html = "";
        if(question.stats.length > 3) {
            let custom_stats = question.stats.slice(0, question.stats.length-3);
            for(var i = 0; i < custom_stats.length; i++) {
                let option = question.options[i];
                let stat = custom_stats[i];
                new_html += "<p class='text-center text-secondary mb-0'>" + option + ": <span id='stats-" + i + "' class='text-primary'>" + stat + "</span></p>";
            }
        }
        $("#response-area").html(new_html);
        $("#did-not-vote-text").html(question.stats[question.stats.length-3] + " did not vote");
        $("#total-voters-text").html(question.stats[question.stats.length-2] + " vote(s)");
        $("#participation-text").html(question.stats[question.stats.length-1] + "% participation");
        $("#stats-topic").hide();
        $("#stats-view").show();
    });
}

function clear_topic() {
    socket.send("CLR");
}

function verify_identity() {
    $(document).ready(function() {
        let access_code = $("#access-code").val();
        socket.send(access_code);
        $("#verify-identity-fields").hide();
        $("#verify-identity-loading").show();
        $("#access-code").val("");
    });
}

function show_change_topic() {
    $(document).ready(function() {
        $("#home").hide();
        $("#change-topic").show();
    });
}

function show_stats_topic() {
    $(document).ready(function() {
        $("#home").hide();
        $("#stats-topic").show();
    });
}

function back_to_home() {
    $(document).ready(function() {
        $("#change-topic").hide();
        $("#reset-topic").hide();
        $("#stats-topic").hide();
        $("#stats-view").hide();
        $("#home").show();
    });
}

function back_to_stats() {
    $(document).ready(function() {
        $("#stats-view").hide();
        $("#stats-topic").show();
    });
}

function show_reset_topic() {
    $(document).ready(function() {
        $("#home").hide();
        $("#reset-topic-options").show();
        $("#reset-topic-loading").hide();
        $("#reset-topic-success").hide();
        $("#reset-topic-failure").hide();
        $("#reset-topic").show();
    });
}

function vote(value) {
    $(document).ready(function() {
        socket.send("VOTE-" + qid + "-" + value);
        $("#question-options").hide();
        $("#vote-loading").show();
    });
}

connect(voting);
