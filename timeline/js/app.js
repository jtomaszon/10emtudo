; (function(window, document, $, undefined) {
    var timelineGap = 10,
        c,
        ctx, 
        slides, 
        currentPresentation, 
        currentSlide, 
        currTextTime,
        previewVideo,

        //cached selectors
        presList = $('.pres-list'),
        content = $('.content'),

        //zon namespace
        pns = 'presentations',
        
        //row scheme
        slide = {
            title: null,
            bullets: null,
            image: null,
            videoStart: 0,
            videoEnd: 0
        }

        presentation = {
            id: null,
            name: null,
            slides: [],
            videoUrl: null
        };

    $.ajaxSetup({
        cache: false
    });

    function queryString(key) {
        var re = new RegExp(key + "=(\\w+)"),
            result = location.href.match(re);

        if(result) {
            return result[1];
        }
        return null;
    }

    function feedReveal(presId, Reveal) {
        var tpl = "<section data-markdown><script type=\"text/template\">#TITLE</script></section>",
            pres = zon(pns).get(presId),
            videoSrc = 'videos/' + pres.videoUrl; // + '?rnd=' + Math.random(),
            slides = pres.slides,
            buffer = "";

        for(var i=0; i < slides.length; i++) {
            buffer += tpl.replace(/TITLE/, slides[i].title);
        }

        $('.slides').html(buffer);
        $('.the-video')[0].src = videoSrc;
        previewVideo = Popcorn('.the-video');
        window.lero = previewVideo;

        //carrega todos os tempos em que o video deve parar de tocar
        slides.forEach(function(data, i) {
            previewVideo.code({
                end: data.videoEnd,
                onEnd: function() {
                    previewVideo.pause();
                }
            });
        });

        //roda o video do slide 1
        setVideoTime(previewVideo, +slides[0].videoStart);

        Reveal.addEventListener('slidechanged', function(event) {
            // event.previousSlide, event.currentSlide, event.indexh, event.indexv
            var slide = slides[event.indexh];
            setVideoTime(previewVideo, +slide.videoStart);
        });

        function setVideoTime(v, t) {
            if(v.duration()) {
              v.currentTime(t);

            setTimeout(function() {
                v.play();
            }, 100);

            } else {
              v.on('loadedmetadata', function() {
                v.currentTime(t);
                setTimeout(function() {
                    v.play();
                }, 100);

              });
            }
        }

        function lala() {
            previewVideo.pause();
            //previewVideo.currentTime(slides[0].videoStart);
            //previewVideo.play();

            $('.the-video')[0].removeEventListener('canplay', lala);
        }

        //$('.the-video')[0].addEventListener('canplay', lala);
    }

    function newPres() {
        var p =  Object.create(presentation);
        p.name = 'New presentation';
        return p;
    }

    function newSlide(presId) {
        var s = Object.create(slide);
        resetSlideForm();

        $('.btn-save-slide').removeClass('hidden');
        $('.btn-update-slide').addClass('hidden');


        s.title = 'New title';
        $('.slide-form').css('visibility', 'visible');
    }

    function listPresentations() {
        var buffer = "";

        zon(pns).each(function(index, id, obj) {
            buffer += "<li><a data-id='" + id + "' class='lnk-edit-pres'>" + (obj.name || 'unnamed presentation') + "</a></li>";
        });
        presList.html(buffer);
    }

    function listSlides(presId) {
        slides = zon(pns).get(presId).slides || [];
        var slideBuffer = "<li><a class='lnk-new-slide' data-pres-id='" + presId + "'>New slide</a></li>";

        for(var i = 0; i < slides.length; i++) {
            slideBuffer += "<li><a class='lnk-edit-slide' data-id='" + i + "'>" + slides[i].title + "</a></li>";
        }

        $('.slides').html(slideBuffer);
    }

    function saveSlide() {
        var title = $('#slide-title').val() || 'new slide',
            bullets = $('#slide-bullets').val(),
            vstart = $('#slide-video-start').val(),
            vend = $('#slide-video-end').val(),
            slide = {
                title: title,
                bullets: bullets,
                videoStart: vstart,
                videoEnd: vend
            };

        slides.push(slide);

        //retrieve presentation
        var p = zon(pns).get(currentPresentation);
        p.slides = slides;
        zon(pns).update(currentPresentation, p);

        //clean form and upate slide list
        resetSlideForm();
        $('.slide-form').css('visibility', 'hidden');

        listSlides(currentPresentation);
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

        if(!pres.slides) {
            pres.slides = [];
        }
        
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

    function editSlide(slideIndex) {
        var p = zon(pns).get(currentPresentation),
            slide = p.slides[slideIndex];

        $('.btn-save-slide').addClass('hidden');
        $('.btn-update-slide').removeClass('hidden');

        $('.slide-form').css('visibility', 'visible');
        $('#slide-title').val(slide.title);
        $('#slide-bullets').val(slide.bullets);
        $('#slide-video-start').val(slide.videoStart);
        $('#slide-video-end').val(slide.videoEnd);
        currentSlide = slideIndex;
    }

    function updateSlide() {
        var title = $('#slide-title').val() || 'new slide',
            bullets = $('#slide-bullets').val(),
            vstart = $('#slide-video-start').val(),
            vend = $('#slide-video-end').val(),
            slide = {
                title: title,
                bullets: bullets,
                videoStart: vstart,
                videoEnd: vend
            };

        var p = zon(pns).get(currentPresentation);
        p.slides[currentSlide] = slide;

        zon(pns).update(currentPresentation, p);

        resetSlideForm();
        currTextTime = null;
        listSlides(currentPresentation);
    }

    function resetSlideForm() {
        $('#slide-title').val('');
        $('#slide-bullets').val('');
        $('#slide-video-start').val('');
        $('#slide-video-end').val('');
    }

    function loadVideo(v, pres) {
        //var v = $('.video-pres');
        v[0].volume = 0;
        v[0].type = 'video/webm; codecs="vp8.0, vorbis"';
        v[0].src = 'videos/' + pres.videoUrl;// + '?rnd=' + Math.random();
        Popcorn('#video').preload('auto');
    }

    function editSlides(el, ev) {
        var id = $(el).data('pres-id'),
            pres = zon(pns).get(id);

        currentPresentation = id;

        $.ajax({
            url: 'edit-slides.html'
        }).done(function(data) {
            content.html(data);

            $('#pres-id').val(id);
            $('.pres-name').html(pres.name);

            listSlides(id);

            var rawURL = location.href + 'videos/' + pres.videoUrl;
            var v = $('.video-pres');

            //se este video ja teve a timeline bufferizada, usa-a
            //senao, faz o download do video para criar timeline
            if(zon(rawURL + 'complete').size()) {
                zon(rawURL).each(function(index, id, data) {
                    for(var i=0; i < data.length; i++) {
                        $('.timeline').append( getCard(data[i], i+1) );
                    }
                    //gambiarra temporaria
                    tlCards = [];
                });

                $('.loading').addClass('hidden');
                loadVideo(v, pres);
            } else {
                var videoLoaded = false;
                c = $('#c')[0];
                ctx = c.getContext('2d');

                loadVideo(v, pres);

                //garante que algum pedaço do video ja carregou
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
                                $('.loading').html('Loading timeline. Please, wait...');

                                setTimeout(function() {
                                    buildTimeline();
                                }, 300);

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

    function getCard(imgData, cardIndex) {
        var x = $("<div class='tl-img-container' data-card-index='" + cardIndex + "'><div><img class='tl-img' src='" + imgData + "'></div></div>");

        for(var i=0; i < 10; i++) {
            x.append("<div class='tl-time' data-t='" + (i+1) + "'>&nbsp;</div>");
        }

        return x;
    }

    var tlCards = [], cardsId;

    function buildTimeline(v, nextPos) {
        var readFromCache = false;

        if(!v) {
            v = $('.video-pres')[0];
        }

        //var rawURL = v.src.substr(0, v.src.indexOf('?'));
        var rawURL = v.src;

        if(!nextPos) {
            nextPos = timelineGap;
        }

        var len = v.duration;
        
        if(nextPos < len) {
            v.currentTime = nextPos;

            ctx.drawImage(v, 0, 0, 100, 50);
            tlCards.push(c.toDataURL());
            $('.timeline').append( getCard(c.toDataURL(), nextPos/timelineGap) );

            nextPos += timelineGap;
            setTimeout(function() {
                buildTimeline(v, nextPos);
            }, 300);
        } else {
            cardsId = zon(rawURL).add(tlCards);
            zon(rawURL + 'complete').add(true);
            tlCards = [];
            $('.loading').html('').addClass('hidden');
        }
    }

    function moveVideoTime(el) {

        var $el = $(el),
            cardIndex = $el.parent().data('card-index'),
            t = $el.data('t'),
            total = (cardIndex * 10) - 10,
            v = Popcorn('#video');

        v.currentTime(total + t);

        if(currTextTime) {
            currTextTime.value = total+t;
        }

    }

    function previewPres() {
        var url = 'preview.html?presId=' + currentPresentation;
        window.open(url, '__blank');
    }

    function publishPres() {
        alert('Comming soon');
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

    $(document).on('click', '.lnk-new-slide', function(ev) {
        var presId = $(this).data('pres-id');
        newSlide(presId);
    });

    $(document).on('click', '.btn-save-slide', function(ev) {
        saveSlide();
    });

    $(document).on('click', '.lnk-edit-slide', function(ev) {
        var slideIndex = $(this).data('id');
        editSlide(slideIndex);
    });

    $(document).on('click', '.btn-update-slide', function(ev) {
        updateSlide();
    });

    $(document).on('click', '.tl-time', function(ev) {
        moveVideoTime(this);
    });

    $(document).on('click', '.txttime', function(ev) {
        currTextTime = this;
    });

    $(document).on('keydown', '.txttime', function(ev) {
        ev.preventDefault();
    });

    $(document).on('click', '.lnk-publish', function(ev) {
        publishPres();
    });

    $(document).on('click', '.lnk-preview', function(ev) {
        previewPres();
    });

    window.dez = {
        newSlide: newSlide,
        newPres: newPres,
        listPresentations: listPresentations,
        savePres: savePres,
        buildTimeline: buildTimeline,
        queryString: queryString,
        feedReveal: feedReveal
    };
})(window, document, jQuery);