$(() => {
    let room, socketio;
    fetch("https://api.ipify.org?format=json")
        .then(response => response.json())
        .then(data => { room = data.ip; })
        .then(() => {
            socketio = io({ transport: ["websocket"] });
            socketio.on("connect", function () {
                socketio.emit("join", { room });
                socketio.on("join", function (data) { socketio.emit("play", { room: false, user: data.user, html: $("#table").html() }); });
                socketio.on("play", function (data) { $("#table").html(data.html); });
                socketio.on("turn", function (data) {
                    $(`#${data.id}`).attr(
                        "src",
                        $(`#${data.id}`).attr("src").startsWith("static/assets/decks/")
                            ? `static/assets/backs/${$(`#${data.id}`)[0].classList[0]}.png`
                            : `static/assets/decks/${$(`#${data.id}`)[0].classList[0]}/${data.value}`
                    );
                });
                socketio.on("hand", function (data) {
                    $("#table").html(data.html + `<img id = "hand-icon" src = "static/assets/other/hand.png" height = "50px" style = "position: absolute; left: ${data.position.x}; top: ${data.position.y}; z-index: ${data.position.z}" alt = "hand-icon">`);
                    $("#hand-icon").fadeOut(1500, function () {
                        $(this).remove();
                    });
                });
            });

            interact("#table *")
                .draggable({
                    modifiers: [
                        interact.modifiers.restrictRect({
                            restriction: "#table"
                        })
                    ],
                    listeners: {
                        move(event) {
                            $(event.target).css({
                                "left": `${parseFloat($(event.target).css("left")) + event.dx}px`,
                                "top": `${parseFloat($(event.target).css("top")) + event.dy}px`
                            });
                            socketio.emit("play", { room, user: false, html: $("#table").html() });
                        }
                    }
                })
                .gesturable({
                    listeners: {
                        move(event) {
                            $(event.target).css({
                                "transform": `rotate(${parseFloat($(event.target).css("transform").split("(")[1].split(")")[0].split(",")[0]) + event.da}deg)`
                            });
                        }
                    }
                });

            interact("#table .card")
                .on("tap", (event) => {
                    socketio.emit("turn", { room, id: $(event.target).attr("id") });
                })
                .on("hold", (event) => {
                    var x = $(event.target).css("left");
                    var y = $(event.target).css("top");
                    var z = $(event.target).css("z-index");
                    $("#hand").prepend($(event.target).css({ "left": "0", "top": "0", "z-index": "0", "transform": "" }));
                    socketio.emit("hand", { room, html: $("#table").html(), position: { x: x, y: y, z: z } });
                });

            interact("#hand .card")
                .on("tap", (event) => {
                    socketio.emit("turn", { room: false, id: $(event.target).attr("id") });
                })
                .on("hold", (event) => {
                    $("#table").prepend($(event.target).css({
                        "left": `${(($("body").width() / 2) - 34.325 + parseFloat($(event.target).css("left")))}px`,
                        "top": `${$("#table").height() - $(event.target).height()}px`
                    }));
                })
                .draggable({
                    listeners: {
                        move(event) {
                            $(event.target).css({
                                "left": `${parseFloat($(event.target).css("left")) + event.dx}px`
                            });
                        }
                    }
                });
        });
});