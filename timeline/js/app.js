; (function(window, document, $, undefined) {
    var timelineGap = 10, c, ctx;

    $.ajaxSetup({
        cache: false
    });

    //cached selectors
    var presList = $('.pres-list'),
        content = $('.content');

    //zon namespace
    var pns = 'presentations';
    
    //row scheme
    var slide = {
        title: null,
        bullets: null,
        image: null,
        videoStart: 0,
        videoEnd: 0
    };

    var presentation = {
        id: null,
        name: null,
        slides: [],
        videoUrl: null
    };

    function newPres() {
        var p =  Object.create(presentation);
        p.name = 'New presentation';
        return p;
    }

    function newSlide() {
        var s = Object.create(slide);
        s.title = 'New title';
    }

    function listPresentations() {
        var buffer = "";

        zon(pns).each(function(index, id, obj) {
            buffer += "<li><a data-id='" + id + "' class='lnk-edit-pres'>" + (obj.name || 'unnamed presentation') + "</a></li>";
        });
        presList.html(buffer);
    }

    function savePres() {
        var name = $('#pres-name').val(),
            videoUrl = $('#pres-video').val(),
            id = $('#pres-id').val(),
            pres;

        if(!name.trim()) {
            return alert("Name must be filled");
        }

        if(id) {
            pres = zon(pns).get(id) || newPres();
        } else {
            pres = newPres();
        }

        pres.name = name;
        pres.videoUrl = videoUrl;
        zon(pns).add(pres, id);

        listPresentations();
        content.empty();
    }

    function editPres(el, ev) {
        //retrieve pres data
        var id = $(el).data('id'),
            pres = zon(pns).get(id);

        $.ajax({
            url: 'pres-form.html'
        }).done(function(data) {
            content.html(data);

            $('#pres-name').val(pres.name);
            $('#pres-video').val(pres.videoUrl);
            $('#pres-id').val(id);
            $('.btn-save-pres').val('Update');
            $('.btn-delete-pres').removeClass('hidden');
            $('.btn-edit-slide').removeClass('hidden');
            $('.btn-edit-slide').attr('data-pres-id', id);

        });
    }

    function editSlides(el, ev) {
        var id = $(el).data('pres-id'),
            pres = zon(pns).get(id);

        $.ajax({
            url: 'edit-slides.html'
        }).done(function(data) {
            var videoLoaded = false;
            content.html(data);

            var rawURL = location.href + 'videos/' + pres.videoUrl;

            if(zon(rawURL + 'complete').size()) {
                zon(rawURL).each(function(index, id, data) {
                    for(var i=0; i < data.length; i++) {
                        var x = $("<img class='tl-img'>");
                        x.attr('src', data[i]);
                        $('.timeline').append(x);
                    }
                });
                $('.loading').addClass('hidden');
            } else {
                c = $('#c')[0];
                ctx = c.getContext('2d');

                $('.pres-name').html(pres.name);
                var v = $('.video-pres');
                v[0].volume = 0;
                v[0].type = 'video/webm; codecs="vp8.0, vorbis"';
                v[0].src = 'videos/' + pres.videoUrl + '?rnd=' + Math.random();

                //garante que algum pedaço do video ha carregou
                //entao posso começar a contar o download
                v[0].addEventListener('loadedmetadata', function() {

                    v[0].play();
                    setTimeout(function() {
                        v[0].pause();
                    }, 1000);

                    v[0].addEventListener('progress', function() {
                        if(!videoLoaded) {
                            var b = v[0].buffered.end(0),
                                total = v[0].duration;

                            var perc = ~~((b * 100) / total);
                            $('.loading').html(perc + ' %');

                            if(b >= total) {
                                //v.removeClass('hidden');
                                $('.loading').addClass('hidden');
                                buildTimeline();
                                videoLoaded = true;
                            }
                        }
                    });
                });

            }
        });
    }

    function deletePres(el, ev) {
        var c = confirm("Are you sure you want to remove this presentation?"),
            id = $('#pres-id').val();

        if(c) {
            zon(pns).del(id);
            content.empty();
            listPresentations();
        }
    }

    var tlCards = [], cardsId;

    function buildTimeline(v, nextPos) {
        var readFromCache = false;

        if(!v) {
            v = $('.video-pres')[0];
        }

        var rawURL = v.src.substr(0, v.src.indexOf('?'));

        if(!nextPos) {
            nextPos = timelineGap;
        }

        var len = v.duration;
        
        if(nextPos < len) {
            v.currentTime = nextPos;

            ctx.drawImage(v, 0, 0, 100, 50);
            var img = new Image();
            img.src = c.toDataURL();

            //checa se nao eh preto (chrome bg)
            if('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAyCAYAAACqNX6+AAAAyElEQVR4Xu3TsQkAMAzEQHv/oZMUGULFGdwLid+ZOe9dxMAKEinxMQRp9RhBBIkZiOFYiCAxAzEcCxEkZiCGYyGCxAzEcCxEkJiBGI6FCBIzEMOxEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIYLEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDsRBBYgZiOBYSC3IBJx0yAX14GF4AAAAASUVORK5CYII=' != img.src) {
                var x = $("<img class='tl-img'>");
                x.attr('src', c.toDataURL());
                tlCards.push(c.toDataURL());
                $('.timeline').append(x);
            }

            nextPos += timelineGap;
            setTimeout(function() {
                buildTimeline(v, nextPos);
            }, 300);
        } else {
            cardsId = zon(rawURL).add(tlCards);
            zon(rawURL + 'complete').add(true);
            tlCards = [];
        }
    }

    //bindings
    $(document).on('click', '.lnk-new-pres', function(ev) {
        content.load('pres-form.html');
    });

    $(document).on('click', '.lnk-edit-pres', function(ev) {
        editPres(this, ev);
    });

    $(document).on('click', '.btn-save-pres', function(ev) {
        savePres();
    });

    $(document).on('click', '.btn-edit-slide', function(ev) {
        editSlides(this, ev);
    });

    $(document).on('click', '.btn-delete-pres', function(ev) {
        deletePres(this, ev);
    });


    window.dez = {
        newSlide: newSlide,
        newPres: newPres,
        listPresentations: listPresentations,
        savePres: savePres,
        buildTimeline: buildTimeline
    };
})(window, document, jQuery);