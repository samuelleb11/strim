function playM3U8byHlsJS(src) {
    $('#player').replaceWith('<video id="player" controls></video>');
    var video = document.getElementById('player');
    var hls = new Hls();
    hls.attachMedia(video);
    hls.on(Hls.Events.MEDIA_ATTACHED, function() {
        console.log("video and hls.js are now bound together !");
        hls.loadSource(src);
        hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
            console.log("manifest loaded, found " + data.levels.length + " quality level");
            video.play();
        });
    });
    return video;
}

const awaitedEvents = {
    play: 0,
    pause: 0,
};

function playVideo(video) {
    if (!video.paused) {
        return;
    }
    console.log('play fn');
    video.play();
    awaitedEvents.play++;
}

function pauseVideo(video) {
    if (video.paused) {
        return;
    }
    console.log('pause fn');
    video.pause();
    awaitedEvents.pause++;
}

function seekVideo(video, time) {
    video.currentTime = time;
    playVideo(video);
}
let playingInterval;
$(document).ready(function() {
    var exampleSocket = new WebSocket("ws://" + window.location.hostname + ":" + window.location.port);
    exampleSocket.onopen = () => {
        $('#go').click(function () {
            const id = $('#video_id').val();
            const video = playM3U8byHlsJS(`https://media.whnet.ca/emby/videos/${id}/main.m3u8?VideoCodec=h264&AudioCodec=mp3,aac&VideoBitrate=139744000&AudioBitrate=256000&AudioStreamIndex=1&TranscodingMaxAudioChannels=2&SegmentContainer=ts&MinSegments=1&BreakOnNonKeyFrames=True&ManifestSubtitles=vtt&h264-profile=high,main,baseline,constrainedbaseline,high10&h264-level=52&TranscodeReasons=AudioCodecNotSupported`);
            video.autoplay = false;
            video.onplay = () => {
                if (awaitedEvents.play > 0) {
                    awaitedEvents.play--;
                    return;
                }
                exampleSocket.send('play|' + video.currentTime);
                console.log('play', video.currentTime);
            }
            video.onplaying = () => {
                if (playingInterval) {
                    clearInterval(playingInterval);
                    playingInterval = null;
                }
                playingInterval = setInterval(() => {
                    exampleSocket.send('playing|' + video.currentTime);
                }, 500);
                console.log('playing', video.currentTime);
            }
            video.onpause = () => {
                if (awaitedEvents.pause > 0) {
                    awaitedEvents.pause--;
                    return;
                }
                if (playingInterval) {
                    clearInterval(playingInterval);
                    playingInterval = null;
                }
                exampleSocket.send('pause|' + video.currentTime);
                console.log('pause', video.currentTime);
            }

            exampleSocket.onmessage = (message) => {
                const txt = message.data.toString();
                const messageParts = txt.split('|');

                if (messageParts[0] === 'play') {
                    seekVideo(video, messageParts[1]);
                }

                if (messageParts[0] === 'playing') {
                    const time = parseFloat(messageParts[1]);
                    const timeDiff = Math.abs(time - video.currentTime);
                    if (timeDiff > 0.25) {
                        seekVideo(video, time);
                    }
                }

                if (messageParts[0] === 'pause') {
                    pauseVideo(video);
                }
            }
        });
    };

});

