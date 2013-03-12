; (function(window, document, $, undefined) {

  $.ajaxSetup({
    cache: false
  });

  //
  // Quando os ícones de templates são clicados
  // Ajax com o HTML form para inserção de conteúdo
  //
  $("[data-template]").on("click", function(e) {
    var templateId = $(this).data("template");

    $.ajax({
        url: 'templates/html/' + templateId + '.html'
    }).done(function(data) {
      $(".container-form-slide-creator").html(data);
    });

    e.preventDefault();
  });

  //
  // Adiciona um novo bullet
  // OBS: Identifiquei um problema que não havia previsto
  // mapear em qual layout e qual coluna o bullet está sendo inserido
  //
  $(document).on("click", "[data-add-bullet]", function(e) {
    var hash = Math.round(Math.random() * 10000);
    var template = '<li class="bullets-itens"><label for="bullet-'+ hash +'">New item:</label><input type="text" name="bullet-'+ hash +'" id="bullet-'+ hash +'"></li>';
    $(this).parent().find(".form-list-bullets").append(template);

    e.preventDefault();
  });

  //
  // Quando qualquer botão salvar é clicado
  // Previne o evento do form, e retorna um objeto
  // Com um array de bullets + titulo + qual template está usando
  //
  $(document).on("submit", ".form-slide-creator", function(e) {
    var els = this.elements
    , template
    , slideTitle
    , bullets = []
    , obj;

    e.preventDefault();

    $.each(els, function(ind, el){

      if ( el.name === "template" ) {
        template = el.value;
      }

      if ( el.name !== "template" ) {

        if ( el.name.match(/^slide-title/) ){
          slideTitle = el.value;
        }

        if ( el.name.match(/^bullet/)) {
          bullets.push(el.value);
        }

      }

    });

    obj = {
      templateMod: template,
      slideTitle: slideTitle,
      bullets: bullets
    }

    return obj;
  });

})(window, document, jQuery);