$(document).ready(function () {
    $('#year').text(new Date().getFullYear());

    // Estrutura de dados para as orações
    let prayerData = {};
    let prayerSequence = [];
    let currentPrayerIndex = -1;
    let currentRepetition = 0;
    let totalRepetitions = 1;
    let wordHighlightInterval = null;
    let currentWordIndex = -1;
    let words = [];
    let autoplayTimer = null; // Timer para autoplay
    const FONT_STEP = 0.1; // Incremento/decremento do tamanho da fonte em rem
    const MIN_FONT_SIZE = 1.0; // Tamanho mínimo da fonte em rem
    const MAX_FONT_SIZE = 2.5; // Tamanho máximo da fonte em rem
    const BASE_WPM = 120; // Palavras por minuto base (Velocidade 1x - Lenta)

    // Estado da aplicação
    const state = {
        isLatin: false,
        currentMysteryType: 'joyful', // Valor inicial
        prayerSlideActive: false,
        highlightSpeedMultiplier: 1, // 1 = Lento (padrão), 2 = Normal, 3 = Rápido
        isAutoplayActive: false,
        currentFontSize: 1.6, // Tamanho inicial em rem
        isLastPrayer: false, // Indica se é a última oração do rosário
        highlightFinished: false, // Indica se o highlight da última oração terminou
        activeMysteries: { joyful: true, sorrowful: true, glorious: true, luminous: false } // Estado inicial dos mistérios ativos
    };

    // Cache de elementos jQuery
    const $elements = {
        startPrayer: $('#startPrayer'),
        prayerControls: $('#prayerControls'), // Controles originais (serão escondidos)
        prevPrayer: $('#prevPrayer'), // Botão original (será escondido)
        nextPrayer: $('#nextPrayer'), // Botão original (será escondido)
        completeRosary: $('#completeRosary'), // Botão original (será escondido)
        currentPrayerCount: $('#currentPrayerCount'), // Contador original (será escondido)
        portugueseBtn: $('#portugueseBtn'),
        latinBtn: $('#latinBtn'),
        mysteryType: $('#mysteryType'),
        prayerItems: $('.prayer-item'), // Itens originais (serão escondidos)
        portugueseTexts: $('.portuguese-text'),
        latinTexts: $('.latin-text'),
        languageModal: $('#languageModal'),
        modalPortugueseBtn: $('#modalPortugueseBtn'),
        modalLatinBtn: $('#modalLatinBtn'),
        savePreference: $('#savePreference'),
        // Checkboxes de seleção de mistérios
        mysteryCheckboxes: $('.mystery-checkbox'),
        joyfulCheckbox: $('#joyfulCheckbox'),
        sorrowfulCheckbox: $('#sorrowfulCheckbox'),
        gloriousCheckbox: $('#gloriousCheckbox'),
        luminousCheckbox: $('#luminousCheckbox'),
        // Novos elementos para a interface de slide
        prayerSlide: $('<div class="prayer-slide">' +
            '<div class="prayer-content"><h3 class="prayer-title text-xl font-semibold mb-4"></h3><p class="prayer-text"></p></div>' +
            '<div class="prayer-navigation">' + // Navegação principal (anterior/próximo)
            // Botão Reset será adicionado dinamicamente aqui pela função updateSlideNavigation
            '</div>' +
            '<div class="prayer-progress"></div>' +
            '<div class="prayer-controls-container">' + // Container para todos os controles (mobile)
            '<div class="prayer-controls-left">' + // Controles da Esquerda
            '<button id="decreaseFontBtn" class="control-btn" title="Diminuir Fonte"><i class="fas fa-minus"></i></button>' +
            '<button id="increaseFontBtn" class="control-btn" title="Aumentar Fonte"><i class="fas fa-plus"></i></button>' +
            '</div>' +
            '<div id="resetHighlightBtnContainer"></div>' + // Container para o botão de reset no mobile
            '<div class="prayer-controls-right">' + // Controles da Direita
            '<div id="speedControl" class="speed-control-container">' + // Container do botão de velocidade
            '<button id="speedBtn" class="control-btn" title="Velocidade do Destaque"><i class="fas fa-tachometer-alt"></i></button>' +
            '<div class="speed-options">' +
            '<button class="speed-option-btn selected" data-speed="1" title="Velocidade 1x (Lenta)">1x</button>' + // Lenta como padrão
            '<button class="speed-option-btn" data-speed="2" title="Velocidade 2x (Normal)">2x</button>' +
            '<button class="speed-option-btn" data-speed="3" title="Velocidade 3x (Rápida)">3x</button>' +
            '</div>' +
            '</div>' +
            '<button id="autoplayBtn" class="control-btn" title="Autoplay Próxima Oração"><i class="fas fa-play"></i></button>' + // Ícone inicial play
            '</div>' +
            '</div>' +
            // Controles para desktop (duplicados para garantir visibilidade)
            '<div class="prayer-controls-left desktop">' + // Controles da Esquerda (desktop)
            '<button id="decreaseFontBtnDesktop" class="control-btn" title="Diminuir Fonte"><i class="fas fa-minus"></i></button>' +
            '<button id="increaseFontBtnDesktop" class="control-btn" title="Aumentar Fonte"><i class="fas fa-plus"></i></button>' +
            '</div>' +
            '<div class="prayer-controls-right desktop">' + // Controles da Direita (desktop)
            '<div id="speedControlDesktop" class="speed-control-container">' + // Container do botão de velocidade
            '<button id="speedBtnDesktop" class="control-btn" title="Velocidade do Destaque"><i class="fas fa-tachometer-alt"></i></button>' +
            '<div class="speed-options">' +
            '<button class="speed-option-btn selected" data-speed="1" title="Velocidade 1x (Lenta)">1x</button>' +
            '<button class="speed-option-btn" data-speed="2" title="Velocidade 2x (Normal)">2x</button>' +
            '<button class="speed-option-btn" data-speed="3" title="Velocidade 3x (Rápida)">3x</button>' +
            '</div>' +
            '</div>' +
            '<button id="autoplayBtnDesktop" class="control-btn" title="Autoplay Próxima Oração"><i class="fas fa-play"></i></button>' +
            '</div>' +
            '<button class="close-prayer-slide" aria-label="Fechar oração"><i class="fas fa-times"></i></button>' +
            '</div>').appendTo('body'),
        prayerSlideText: null, // Será definido após criar o slide
        prayerSlideTitle: null, // Será definido após criar o slide
        prayerSlideNav: null, // Será definido após criar o slide
        prayerSlideProgress: null, // Será definido após criar o slide
        prayerSlideCloseBtn: null, // Será definido após criar o slide
        increaseFontBtn: null, // Será definido abaixo
        decreaseFontBtn: null, // Será definido abaixo
        speedControl: null, // Será definido abaixo
        speedBtn: null, // Será definido abaixo
        speedOptions: null, // Será definido abaixo
        speedOptionBtns: null, // Será definido abaixo
        autoplayBtn: null, // Será definido abaixo
        resetHighlightBtn: null, // Será definido abaixo (para o botão de reset)
        // Elementos do modal de conclusão
        completionModal: $('#completionModal'),
        closeCompletionModalBtn: $('#closeCompletionModalBtn'),
        // Elementos da legenda
        calendarLegend: $('#calendarLegend')
    };

    // Define os elementos do slide e controles após criá-los
    $elements.prayerSlideText = $elements.prayerSlide.find('.prayer-text');
    $elements.prayerSlideTitle = $elements.prayerSlide.find('.prayer-title');
    $elements.prayerSlideNav = $elements.prayerSlide.find('.prayer-navigation');
    $elements.prayerSlideProgress = $elements.prayerSlide.find('.prayer-progress');
    $elements.prayerSlideCloseBtn = $elements.prayerSlide.find('.close-prayer-slide');
    
    // Controles mobile
    $elements.increaseFontBtn = $('#increaseFontBtn');
    $elements.decreaseFontBtn = $('#decreaseFontBtn');
    $elements.speedControl = $('#speedControl');
    $elements.speedBtn = $('#speedBtn');
    $elements.speedOptions = $elements.speedControl.find('.speed-options');
    $elements.speedOptionBtns = $elements.speedOptions.find('.speed-option-btn');
    $elements.autoplayBtn = $('#autoplayBtn');
    
    // Controles desktop
    $elements.increaseFontBtnDesktop = $('#increaseFontBtnDesktop');
    $elements.decreaseFontBtnDesktop = $('#decreaseFontBtnDesktop');
    $elements.speedControlDesktop = $('#speedControlDesktop');
    $elements.speedBtnDesktop = $('#speedBtnDesktop');
    $elements.speedOptionsDesktop = $elements.speedControlDesktop.find('.speed-options');
    $elements.speedOptionBtnsDesktop = $elements.speedOptionsDesktop.find('.speed-option-btn');
    $elements.autoplayBtnDesktop = $('#autoplayBtnDesktop');
    
    // Botão de finalizar (será criado dinamicamente quando necessário)
    $elements.finishPrayerBtn = null;

    // --- Funções de Preferência de Mistérios ---

    /**
     * Carrega as preferências de mistérios ativos do localStorage.
     */
    function loadMysteryPreferences() {
        const savedPrefs = localStorage.getItem('activeMysteries');
        if (savedPrefs) {
            try {
                const parsedPrefs = JSON.parse(savedPrefs);
                // Valida se o formato é o esperado
                if (typeof parsedPrefs === 'object' && parsedPrefs !== null &&
                    'joyful' in parsedPrefs && 'sorrowful' in parsedPrefs &&
                    'glorious' in parsedPrefs && 'luminous' in parsedPrefs) {
                    state.activeMysteries = parsedPrefs;
                } else {
                    console.warn("Preferências de mistérios salvas em formato inválido. Usando padrão.");
                    // Se inválido, salva o padrão para corrigir
                    saveMysteryPreferences();
                }
            } catch (e) {
                console.error("Erro ao parsear preferências de mistérios:", e);
                // Se erro no parse, salva o padrão
                saveMysteryPreferences();
            }
        }
        // Aplica as preferências carregadas (ou padrão) aos checkboxes
        $elements.joyfulCheckbox.prop('checked', state.activeMysteries.joyful);
        $elements.sorrowfulCheckbox.prop('checked', state.activeMysteries.sorrowful);
        $elements.gloriousCheckbox.prop('checked', state.activeMysteries.glorious);
        $elements.luminousCheckbox.prop('checked', state.activeMysteries.luminous);
    }

    /**
     * Salva o estado atual dos checkboxes de mistérios no localStorage.
     */
    function saveMysteryPreferences() {
        state.activeMysteries.joyful = $elements.joyfulCheckbox.is(':checked');
        state.activeMysteries.sorrowful = $elements.sorrowfulCheckbox.is(':checked');
        state.activeMysteries.glorious = $elements.gloriousCheckbox.is(':checked');
        state.activeMysteries.luminous = $elements.luminousCheckbox.is(':checked');
        localStorage.setItem('activeMysteries', JSON.stringify(state.activeMysteries));
    }

    /**
     * Atualiza as opções do dropdown de mistérios (#mysteryType)
     * com base nos checkboxes ativos.
     */
    function updateMysteryDropdown() {
        const currentSelectedValue = $elements.mysteryType.val();
        $elements.mysteryType.empty(); // Limpa opções existentes

        const mysteryOptions = [
            { value: 'joyful', text: 'Mistérios Gozosos' },
            { value: 'sorrowful', text: 'Mistérios Dolorosos' },
            { value: 'glorious', text: 'Mistérios Gloriosos' },
            { value: 'luminous', text: 'Mistérios Luminosos' }
        ];

        let firstAvailableOption = null;
        let currentSelectionStillAvailable = false;

        mysteryOptions.forEach(option => {
            if (state.activeMysteries[option.value]) {
                const $option = $(`<option value="${option.value}">${option.text}</option>`);
                $elements.mysteryType.append($option);
                if (!firstAvailableOption) {
                    firstAvailableOption = option.value; // Guarda a primeira opção ativa
                }
                if (option.value === currentSelectedValue) {
                    currentSelectionStillAvailable = true; // Marca se a seleção atual ainda está ativa
                }
            }
        });

        // Define a seleção no dropdown
        if (currentSelectionStillAvailable) {
            $elements.mysteryType.val(currentSelectedValue); // Mantém a seleção se ainda ativa
        } else if (firstAvailableOption) {
            $elements.mysteryType.val(firstAvailableOption); // Seleciona a primeira ativa se a anterior foi desativada
        } else {
            // Caso extremo: nenhum mistério ativo (adiciona uma opção desabilitada)
            $elements.mysteryType.append('<option value="" disabled>Nenhum mistério ativo</option>');
            $elements.mysteryType.val('');
        }

        // Atualiza o estado interno após definir o valor do dropdown
        state.currentMysteryType = $elements.mysteryType.val();
    }

    // --- Funções de Idioma ---

    // Verifica se há preferência de idioma salva
    function checkLanguagePreference() {
        const savedPreference = localStorage.getItem('rosaryLanguagePreference');
        if (savedPreference) {
            state.isLatin = savedPreference === 'latin';
            toggleLanguageUI(state.isLatin); // Atualiza apenas a UI inicial
            return true;
        }
        return false;
    }

    // Mostra o modal de seleção de idioma
    function showLanguageModal() {
        $elements.languageModal.addClass('active');
    }

    // Esconde o modal de seleção de idioma
    function hideLanguageModal() {
        $elements.languageModal.removeClass('active');
    }

    // Define o mistério do Rosário baseado no dia da semana, respeitando as preferências
    function setMysteryByDay() {
        const dayOfWeek = new Date().getDay(); // 0=Domingo, 1=Segunda, ..., 6=Sábado
        let mysteryKey = 'joyful'; // Padrão inicial

        switch (dayOfWeek) {
            case 1: case 6: mysteryKey = 'joyful'; break; // Seg, Sab
            case 2: case 5: mysteryKey = 'sorrowful'; break; // Ter, Sex
            case 3: case 0: mysteryKey = 'glorious'; break; // Qua, Dom
            case 4: mysteryKey = 'luminous'; break; // Qui
        }

        // Verifica se o mistério do dia está ativo nas preferências
        if (state.activeMysteries[mysteryKey]) {
            state.currentMysteryType = mysteryKey; // Define o tipo no estado
            $elements.mysteryType.val(mysteryKey); // Seleciona no dropdown
        } else {
            // Se o mistério do dia não estiver ativo, seleciona o primeiro ativo no dropdown
            const firstActiveOption = $elements.mysteryType.find('option:first').val();
            if (firstActiveOption) {
                state.currentMysteryType = firstActiveOption;
                $elements.mysteryType.val(firstActiveOption);
            } else {
                // Nenhum mistério ativo, o dropdown já deve ter a opção "Nenhum..."
                state.currentMysteryType = '';
            }
        }
        console.log("Mistério inicial definido para:", state.currentMysteryType || "Nenhum");
    }

    /* Comentado: A lógica antiga de definir o mistério padrão foi movida para setMysteryByDay
    const diaSemana = new Date().getDay(); // 0=Domingo, 1=Segunda, ..., 6=Sábado
    let mistérioPadrão = 'joyful'; // Padrão inicial

    // Mapeia dia da semana para mistério conforme tradição católica
    switch (diaSemana) {
        case 1: // Segunda-feira
        case 6: // Sábado
            mistérioPadrão = 'joyful';
            break;
        case 2: // Terça-feira
        case 5: // Sexta-feira
            mistérioPadrão = 'sorrowful';
            break;
        case 3: // Quarta-feira
        case 0: // Domingo
            mistérioPadrão = 'glorious';
            break;
        case 4: // Quinta-feira
            mistérioPadrão = 'luminous';
            break;
    }

    // Aplica o mistério padrão e atualiza a interface
    state.currentMystery = mistérioPadrão; // Atualiza o estado global
    $elements.mysteryType.val(mistérioPadrão); // Esta linha é redundante agora com setMysteryByDay
    // A exibição dos mistérios na lista original não é mais necessária, pois ela está escondida.
    //$('#' + mistérioPadrão + '-mysteries').show(); // Comentado ou removido
    */

    // --- Funções da Legenda do Calendário ---

    /**
     * Atualiza a aparência da legenda do calendário com base nos mistérios ativos.
     */
    function updateLegend() {
        const mysteryColors = {
            joyful: 'bg-blue-200 border-blue-400',
            sorrowful: 'bg-red-200 border-red-400',
            glorious: 'bg-yellow-200 border-yellow-400',
            luminous: 'bg-purple-200 border-purple-400',
            disabled: 'bg-gray-300 border-gray-400' // Cor para desativado
        };

        Object.keys(state.activeMysteries).forEach(key => {
            const $legendItem = $(`#legend-${key}`);
            if (!$legendItem.length) return; // Pula se o item da legenda não existir

            const $colorBox = $legendItem.find('.legend-color-box');
            const $disabledTag = $legendItem.find('.legend-disabled-tag');
            const isActive = state.activeMysteries[key];

            // Remove todas as classes de cor anteriores e de estado desativado
            $colorBox.removeClass('bg-blue-100 bg-red-100 bg-yellow-100 bg-purple-100 bg-gray-300');
            $legendItem.removeClass('text-gray-500 opacity-70');

            if (isActive) {
                $colorBox.addClass(mysteryColors[key] || mysteryColors.disabled); // Adiciona cor ativa
                $disabledTag.addClass('hidden'); // Esconde tag (desativado)
            } else {
                $colorBox.addClass(mysteryColors.disabled); // Adiciona cor cinza
                $legendItem.addClass('text-gray-500 opacity-70'); // Aplica estilo cinza/opaco ao item
                $disabledTag.removeClass('hidden'); // Mostra tag (desativado)
            }
        });
    }

    // --- Funções para Mistério do Dia e Calendário ---

    /**
     * Carrega os textos das orações do arquivo JSON
     * usando jQuery.ajax() em vez de fetch()
     */
     function loadPrayerTexts() {
        $.ajax({
            url: 'rosario_textos.json',
            dataType: 'json',
            success: function (data) {
                prayerData = {
                    common: {}, // Orações comuns (Sinal da Cruz, Pai Nosso, etc.)
                    mysteries: {}, // Anúncios dos mistérios e títulos gerais
                    mysteryTitles: {} // Títulos gerais dos tipos de mistério (Gozosos, etc.)
                };
                let commonIdCounter = 1;

                // 1. Processa Orações Comuns (sections)
                $.each(data.sections, function (i, section) {
                    const headerKey = section.header || `section_${i}`; // Usa header como chave ou um fallback
                    $.each(section.items, function (j, item) {
                        const prayerId = commonIdCounter++;
                        prayerData.common[headerKey] = { // Usa headerKey como identificador
                            id: prayerId, // ID numérico sequencial
                            key: headerKey, // Chave textual (header)
                            'pt-br': item['pt-br'], // Usa 'pt-br' (com hífen) como chave
                            la: item['la'] // Mantém title e text
                        };
                    });
                });

                // 2. Processa Mistérios (mysteries)
                if (data.mysteries && data.mysteries.langs) {
                    prayerData.mysteries = data.mysteries.langs; // Armazena toda a estrutura dos mistérios

                    // Extrai títulos gerais dos mistérios para fácil acesso
                    $.each(data.mysteries.langs['pt-br'], function(mysteryKey, mysteryData) {
                        if (mysteryData.title) {
                            if (!prayerData.mysteryTitles['pt-br']) prayerData.mysteryTitles['pt-br'] = {};
                            prayerData.mysteryTitles['pt-br'][mysteryKey] = mysteryData.title;
                        }
                    });
                     $.each(data.mysteries.langs['la'], function(mysteryKey, mysteryData) {
                        if (mysteryData.title) {
                             if (!prayerData.mysteryTitles['la']) prayerData.mysteryTitles['la'] = {};
                            prayerData.mysteryTitles['la'][mysteryKey] = mysteryData.title;
                        }
                    });
                } else {
                    console.error("Estrutura 'mysteries.langs' não encontrada ou inválida no JSON.");
                }

                // 3. Adiciona IDs específicos para orações que serão referenciadas diretamente na sequência
                //    (Isso pode ser ajustado conforme a implementação de buildPrayerSequence)
                // Exemplo: Mapear 'pater_noster' para um ID fixo se necessário,
                // mas por enquanto vamos referenciar por chave ('pater_noster', 'ave_maria', etc.)

                console.log("Dados das orações carregados:", prayerData); // Log para depuração

                // Inicializar a aplicação após carregar os textos
                initializeApp();
            },
            error: function (xhr, status, error) {
                console.error('Erro ao carregar textos:', error);
                alert('Erro ao carregar os textos das orações. Por favor, recarregue a página.');
            }
        });
    }

    /**
     * Inicializa a aplicação configurando animações
     * e eventos usando jQuery
     */
    function initializeApp() {
        // Esconde a lista de orações original e controles
        $('#prayers').hide();
        $elements.prayerControls.hide();

        // Configura eventos
        $elements.startPrayer.on('click', startPrayerSlide);
        $elements.portugueseBtn.on('click', function () { setLanguage(false); localStorage.setItem('rosaryLanguagePreference', 'portuguese'); });
        $elements.latinBtn.on('click', function () { setLanguage(true); localStorage.setItem('rosaryLanguagePreference', 'latin'); });
        $elements.mysteryType.on('change', updateMysteryType);
        $elements.prayerSlideCloseBtn.on('click', closePrayerSlide);
        $elements.closeCompletionModalBtn.on('click', hideCompletionModal); // Evento para fechar modal de conclusão

        // Evento para checkboxes de mistério
        $elements.mysteryCheckboxes.on('change', function() {
            saveMysteryPreferences();
            updateMysteryDropdown();
            // Opcional: Atualizar calendário/mistério do dia imediatamente
            displayDailyMystery(); // Atualiza o texto do mistério do dia
            const today = new Date();
            generateCalendar(today.getFullYear(), today.getMonth()); // Regenera calendário com novos status
            updateLegend(); // Atualiza a legenda
        });

        // Eventos para controles adicionais (mobile)
        $elements.increaseFontBtn.on('click', increaseFontSize);
        $elements.decreaseFontBtn.on('click', decreaseFontSize);
        $elements.speedBtn.on('click', toggleSpeedOptions);
        $elements.speedOptionBtns.on('click', function () {
            const speed = $(this).data('speed');
            setHighlightSpeed(speed);
            $elements.speedControl.removeClass('open'); // Fecha opções após selecionar
        });
        $elements.autoplayBtn.on('click', toggleAutoplay);
        
        // Eventos para controles adicionais (desktop)
        $elements.increaseFontBtnDesktop.on('click', increaseFontSize);
        $elements.decreaseFontBtnDesktop.on('click', decreaseFontSize);
        $elements.speedBtnDesktop.on('click', toggleSpeedOptionsDesktop);
        $elements.speedOptionBtnsDesktop.on('click', function () {
            const speed = $(this).data('speed');
            setHighlightSpeed(speed);
            $elements.speedControlDesktop.removeClass('open'); // Fecha opções após selecionar
        });
        $elements.autoplayBtnDesktop.on('click', toggleAutoplay);
        // O listener para resetHighlightBtn é adicionado em updateSlideNavigation

        // Fecha opções de velocidade se clicar fora
        $(document).on('click', function (event) {
            if (!$elements.speedControl.is(event.target) && $elements.speedControl.has(event.target).length === 0) {
                $elements.speedControl.removeClass('open');
            }
        });

        // Eventos para o modal de idioma
        $elements.modalPortugueseBtn.on('click', function () { handleLanguageSelection(false); });
        $elements.modalLatinBtn.on('click', function () { handleLanguageSelection(true); });

        // Eventos de teclado para navegação
        $(document).on('keydown', handleKeyPress);

        // Eventos de toque (swipe) para navegação
        setupTouchEvents();

        // Carrega preferências de mistérios e atualiza UI relacionada
        loadMysteryPreferences();
        updateMysteryDropdown();

        // Verifica preferência de idioma salva
        const hasSavedPreference = checkLanguagePreference();
        if (!hasSavedPreference) {
            setTimeout(showLanguageModal, 500); // Mostra modal se não houver pref salva
        }

        // Configura animação inicial (opcional)
        $('header.fade-in').addClass('animate'); // Garante que a classe exista se usada no HTML

        // Define o estado inicial dos botões de velocidade e autoplay
        setHighlightSpeedUI(state.highlightSpeedMultiplier); // Marca o botão padrão (1x)
        updateAutoplayButtonUI(); // Define o estado inicial do botão autoplay

        // Define o mistério inicial no dropdown baseado no dia E nas preferências
        setMysteryByDay();

        // Exibe o mistério do dia e gera o calendário (respeitando preferências)
        displayDailyMystery();
        const today = new Date();
        generateCalendar(today.getFullYear(), today.getMonth());
        updateLegend(); // Atualiza a legenda inicial
    }

    // --- Funções para Mistério do Dia e Calendário ---

    /**
     * Retorna o nome, chave e classe CSS do mistério para uma data específica.
     * @param {Date} date - O objeto Date para verificar.
     * @returns {object} - Objeto com { name, key, colorClass, isActive }.
     */
    function getMysteryForDate(date) {
        const dayOfWeek = date.getDay(); // 0=Domingo, 1=Segunda, ..., 6=Sábado
        let mysteryInfo = { name: 'Desconhecido', key: 'unknown', colorClass: 'bg-gray-100 text-gray-800 border-gray-300', isActive: false };

        switch (dayOfWeek) {
            case 1: // Segunda
            case 6: // Sábado
                mysteryInfo = { name: 'Mistérios Gozosos', key: 'joyful', colorClass: 'bg-blue-100 text-blue-800 border-blue-300' };
                break;
            case 2: // Terça
            case 5: // Sexta
                mysteryInfo = { name: 'Mistérios Dolorosos', key: 'sorrowful', colorClass: 'bg-red-100 text-red-800 border-red-300' };
                break;
            case 3: // Quarta
            case 0: // Domingo
                mysteryInfo = { name: 'Mistérios Gloriosos', key: 'glorious', colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
                break;
            case 4: // Quinta
                mysteryInfo = { name: 'Mistérios Luminosos', key: 'luminous', colorClass: 'bg-purple-100 text-purple-800 border-purple-300' };
                break;
        }

        // Verifica se o mistério determinado está ativo nas preferências do usuário
        mysteryInfo.isActive = state.activeMysteries[mysteryInfo.key] ?? false; // Usa ?? para caso a key seja 'unknown'

        return mysteryInfo;
    }

    /**
     * Exibe o mistério do dia atual no elemento apropriado.
     */
    function displayDailyMystery() {
        const today = new Date();
        const mystery = getMysteryForDate(today);
        const $dailyMysteryText = $('#dailyMysteryText');
        if ($dailyMysteryText.length) {
            let text = `${mystery.name} (${today.toLocaleDateString('pt-BR', { weekday: 'long' })})`;
            if (!mystery.isActive && mystery.key !== 'unknown') {
                text += ' <span class="text-xs text-red-600 font-medium">(Desativado nas opções)</span>';
            }
            $dailyMysteryText.html(text); // Usa .html() para renderizar o span
            // Opcional: Adicionar classe ao container para estilização
            // $('#dailyMysteryContainer').addClass(mystery.colorClass.split(' ')[0]); // Adiciona a classe de fundo
        } else {
            console.warn("Elemento #dailyMysteryText não encontrado.");
        }
    }

    /**
     * Gera e exibe o calendário do mês especificado.
     * @param {number} year - O ano.
     * @param {number} month - O mês (0-11).
     */
    function generateCalendar(year, month) {
        const $calendarContainer = $('#calendarContainer');
        if (!$calendarContainer.length) {
            console.warn("Elemento #calendarContainer não encontrado.");
            return;
        }
        $calendarContainer.empty(); // Limpa calendário anterior

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentDay = today.getDate();

        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startingDay = firstDayOfMonth.getDay(); // 0 = Domingo, 1 = Segunda, ...

        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

        // Cabeçalho do Calendário
        const $header = $(`
            <div class="flex justify-between items-center mb-4">
                <button id="prevMonthBtn" class="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Mês Anterior"><i class="fas fa-chevron-left"></i></button>
                <h4 class="text-lg font-semibold text-indigo-700">${monthNames[month]} ${year}</h4>
                <button id="nextMonthBtn" class="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Próximo Mês"><i class="fas fa-chevron-right"></i></button>
            </div>
        `);
        $calendarContainer.append($header);

        // Grid do Calendário
        const $grid = $('<div class="grid grid-cols-7 gap-1 text-center"></div>');

        // Nomes dos Dias da Semana
        dayNames.forEach(day => {
            $grid.append(`<div class="font-medium text-sm text-gray-600 pb-1">${day}</div>`);
        });

        // Células Vazias antes do dia 1
        for (let i = 0; i < startingDay; i++) {
            $grid.append('<div></div>');
        }

        // Dias do Mês
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const mystery = getMysteryForDate(date);
            // const mystery = getMysteryForDate(date); // Linha duplicada removida
            let dayClasses = `p-1.5 border rounded text-xs cursor-default transition-colors ${mystery.colorClass}`;
            let title = `Dia ${day}: ${mystery.name}`;

            // Adiciona estilo se o mistério do dia estiver desativado
            if (!mystery.isActive && mystery.key !== 'unknown') {
                dayClasses += ' opacity-60 grayscale-[50%]'; // Estilo para desativado
                title += " (Desativado)";
            }

            // Marca o dia atual
            if (year === currentYear && month === currentMonth && day === currentDay) {
                dayClasses += ' ring-2 ring-indigo-500 font-bold'; // Destaque extra para hoje
                if (!title.includes("(Hoje)")) { // Evita duplicar "(Hoje)"
                    title += " (Hoje)";
                }
            }

            $grid.append(`<div class="${dayClasses}" title="${title}" data-mystery="${mystery.key}">${day}</div>`);
        }

        $calendarContainer.append($grid);

        // Adiciona eventos aos botões de navegação do mês
        $('#prevMonthBtn').on('click', () => {
            const newMonth = month === 0 ? 11 : month - 1;
            const newYear = month === 0 ? year - 1 : year;
            generateCalendar(newYear, newMonth);
        });
        $('#nextMonthBtn').on('click', () => {
            const newMonth = month === 11 ? 0 : month + 1;
            const newYear = month === 11 ? year + 1 : year;
            generateCalendar(newYear, newMonth);
        });
    }


    // --- Funções da Interface de Slide ---
    function startPrayerSlide() {
        buildPrayerSequence(); // Constrói a sequência baseada no mistério
        if (prayerSequence.length === 0) {
            alert("Não foi possível iniciar a oração. Verifique os dados.");
            return;
        }
        currentPrayerIndex = 0;
        currentRepetition = 0;
        state.prayerSlideActive = true;
        $elements.prayerSlide.addClass('active');
        $('body').css('overflow', 'hidden'); // Impede scroll da página principal
        displayCurrentPrayer();
    }

    function prevPrayerSlide() {
        stopWordHighlight();
        clearTimeout(autoplayTimer); // Cancela autoplay ao navegar manualmente
        if (currentRepetition > 0) {
            currentRepetition--;
        } else if (currentPrayerIndex > 0) {
            currentPrayerIndex--;
            const prevPrayerInfo = prayerSequence[currentPrayerIndex];
            totalRepetitions = prevPrayerInfo.repetitions || 1;
            currentRepetition = totalRepetitions - 1; // Vai para a última repetição da oração anterior
        } else {
            return; // Já está na primeira oração
        }
        displayCurrentPrayer();
    }

    function nextPrayerSlide() {
        stopWordHighlight();
        clearTimeout(autoplayTimer); // Cancela autoplay ao navegar manualmente
        hideFinishButton(); // Esconde o botão de conclusão ao navegar
        
        if (currentRepetition < totalRepetitions - 1) {
            currentRepetition++;
            state.isLastPrayer = false; // Não é a última oração se ainda há repetições
        } else if (currentPrayerIndex < prayerSequence.length - 1) {
            currentPrayerIndex++;
            currentRepetition = 0;
            const currentPrayerInfo = prayerSequence[currentPrayerIndex];
            totalRepetitions = currentPrayerInfo.repetitions || 1;
            
            // Verifica se é a última oração do rosário
            state.isLastPrayer = (currentPrayerIndex === prayerSequence.length - 1);
        } else {
            // Fim do rosário
            closePrayerSlide();
            showCompletionModal(); // Mostra o modal estilizado
            return;
        }
        displayCurrentPrayer();
    }

    function closePrayerSlide() {
        stopWordHighlight();
        clearTimeout(autoplayTimer);
        state.isAutoplayActive = false; // Desativa autoplay ao fechar
        updateAutoplayButtonUI();
        state.prayerSlideActive = false;
        $elements.prayerSlide.removeClass('active');
        $('body').css('overflow', ''); // Restaura scroll
        currentPrayerIndex = -1;
        currentRepetition = 0;
    }

    function setLanguage(isLatin) {
        state.isLatin = isLatin;
        toggleLanguageUI(isLatin);
        // Se o slide estiver ativo, atualiza o texto
        if (state.prayerSlideActive && currentPrayerIndex >= 0) {
            displayCurrentPrayer();
        }
    }

    function toggleLanguageUI(isLatin) {
        if (isLatin) {
            $elements.portugueseBtn.removeClass('active-language');
            $elements.latinBtn.addClass('active-language');
            // Atualiza botões do modal também
            $elements.modalPortugueseBtn.removeClass('bg-indigo-600 text-white').addClass('bg-white text-gray-800 border border-gray-300');
            $elements.modalLatinBtn.removeClass('bg-white text-gray-800 border border-gray-300').addClass('bg-indigo-600 text-white');
        } else {
            $elements.portugueseBtn.addClass('active-language');
            $elements.latinBtn.removeClass('active-language');
            // Atualiza botões do modal também
            $elements.modalPortugueseBtn.addClass('bg-indigo-600 text-white').removeClass('bg-white text-gray-800 border border-gray-300');
            $elements.modalLatinBtn.addClass('bg-white text-gray-800 border border-gray-300').removeClass('bg-indigo-600 text-white');
        }
    }

    function handleLanguageSelection(isLatin) {
        setLanguage(isLatin);
        if ($elements.savePreference.is(':checked')) {
            localStorage.setItem('rosaryLanguagePreference', isLatin ? 'latin' : 'portuguese');
        }
        hideLanguageModal();
    }

    function updateMysteryType() {
        const newMysteryType = $elements.mysteryType.val();
        if (newMysteryType !== state.currentMysteryType) {
            state.currentMysteryType = newMysteryType;
            // Se o slide estiver ativo, talvez reiniciar ou avisar o usuário?
            // Por enquanto, apenas atualiza o estado. A sequência será reconstruída
            // na próxima vez que 'startPrayerSlide' for chamado.
            if (state.prayerSlideActive) {
                console.log("Tipo de mistério alterado no dropdown. A nova sequência será usada na próxima vez que iniciar a oração.");
                // Poderia adicionar um aviso visual ou fechar o slide aqui.
            }
        }
    }

    /* Removido: A lógica foi movida para a nova função setMysteryByDay que considera preferências
    function setMysteryByDay_OLD() {
        const dayOfWeek = new Date().getDay(); // 0=Domingo, 1=Segunda, ..., 6=Sábado
        let defaultMystery = 'joyful';
        switch (dayOfWeek) {
            case 1: case 6: defaultMystery = 'joyful'; break; // Seg, Sab
            case 2: case 5: defaultMystery = 'sorrowful'; break; // Ter, Sex
            case 3: case 0: defaultMystery = 'glorious'; break; // Qua, Dom
            case 4: defaultMystery = 'luminous'; break; // Qui
        }
        state.currentMysteryType = defaultMystery; // Define o tipo no estado
        $elements.mysteryType.val(defaultMystery);
    }
    */

    function displayCurrentPrayer() {
        if (currentPrayerIndex < 0 || currentPrayerIndex >= prayerSequence.length) return;

        const prayerInfo = prayerSequence[currentPrayerIndex];
        const langKey = state.isLatin ? 'la' : 'pt-br';
        const $prayerContent = $elements.prayerSlide.find('.prayer-content');
        let text = "Erro: Texto não encontrado.";
        let title = "Erro";

        try {
            if (prayerInfo.type === 'common') {
                const prayerKey = prayerInfo.key;
                if (prayerData.common[prayerKey] && prayerData.common[prayerKey][langKey]) {
                    const prayerDetails = prayerData.common[prayerKey][langKey];
                    text = prayerDetails.text || text; // Usa fallback se texto estiver vazio
                    title = prayerDetails.title || title; // Usa fallback se título estiver vazio
                } else {
                    console.error(`Oração comum com chave '${prayerKey}' ou idioma '${langKey}' não encontrada.`);
                }
            } else if (prayerInfo.type === 'mystery_announcement') {
                const mysteryType = prayerInfo.mysteryType;
                const mysteryIndex = prayerInfo.mysteryIndex;
                if (prayerData.mysteries[langKey] &&
                    prayerData.mysteries[langKey][mysteryType] &&
                    prayerData.mysteries[langKey][mysteryType][mysteryIndex])
                {
                    text = prayerData.mysteries[langKey][mysteryType][mysteryIndex]; // O texto é o próprio anúncio

                    // Constrói um título (ex: "Mistérios Gozosos - Primeiro Mistério")
                    const generalMysteryTitle = prayerData.mysteryTitles[langKey]?.[mysteryType] || mysteryType; // Título geral ou a chave
                    // Pega a primeira parte do anúncio como sub-título (ex: "A Anunciação...")
                    const announcementStart = text.split(':').length > 1 ? text.split(':')[1].trim().split(' ').slice(0, 4).join(' ') + '...' : text.split(' ').slice(0, 4).join(' ') + '...';
                    title = `${generalMysteryTitle} - ${announcementStart}`;

                } else {
                    console.error(`Anúncio do mistério ${mysteryType} - ${mysteryIndex} não encontrado para o idioma ${langKey}.`);
                }
            } else {
                console.error(`Tipo de item desconhecido na sequência: ${prayerInfo.type}`);
            }
        } catch (e) {
            console.error("Erro ao processar dados da oração:", e, prayerInfo);
            // Mantém texto/título de erro definidos inicialmente
        }


        // Adiciona fade-out antes de mudar o texto
        $prayerContent.addClass('fade-out');

        // Espera a transição de fade-out terminar para atualizar o conteúdo
        setTimeout(() => {
            // Prepara o texto para highlight palavra por palavra
            words = text.split(/(\s+)/).filter(w => w.trim().length > 0);
            const wrappedText = words.map((word, index) => `<span class="word" data-index="${index}" role="text">${word}</span>`).join(' '); // Adiciona role="text"
            $elements.prayerSlideText.html(wrappedText);
            $elements.prayerSlideTitle.text(title); // Usa o título construído

            // Atualiza navegação e progresso
            updateSlideNavigation();
            updateSlideProgress(prayerInfo); // Passa prayerInfo para updateSlideProgress

            // Remove fade-out e inicia highlight
            $prayerContent.removeClass('fade-out');
            // Garante que o highlight inicie após a atualização do conteúdo e fade-in
            startWordHighlight();
        }, 400); // Deve corresponder à duração da transição de .prayer-content
    }

    function updateSlideNavigation() {
        $elements.prayerSlideNav.empty(); // Limpa botões antigos
        $('#resetHighlightBtnContainer').empty(); // Limpa o container do botão reset no mobile

        // Cria botões com as classes de estilo base definidas no CSS
        const $prevBtn = $('<button aria-label="Oração anterior"><i class="fas fa-arrow-left"></i></button>');
        // Cria o botão Reset para desktop
        const $resetBtn = $('<button id="resetHighlightBtn" class="control-btn" title="Reiniciar Destaque (R)"><i class="fas fa-undo"></i></button>');
        // Cria o botão Reset para mobile (duplicado)
        const $resetBtnMobile = $('<button id="resetHighlightBtnMobile" class="control-btn" title="Reiniciar Destaque (R)"><i class="fas fa-undo"></i></button>');
        const $nextBtn = $('<button aria-label="Próxima oração"><i class="fas fa-arrow-right"></i></button>');

        $prevBtn.on('click', prevPrayerSlide);
        $resetBtn.on('click', resetHighlight); // Adiciona listener para o botão reset desktop
        $resetBtnMobile.on('click', resetHighlight); // Adiciona listener para o botão reset mobile
        $nextBtn.on('click', nextPrayerSlide);

        // Desabilita botões no início/fim
        if (currentPrayerIndex === 0 && currentRepetition === 0) {
            $prevBtn.prop('disabled', true);
        }
        if (currentPrayerIndex === prayerSequence.length - 1 && currentRepetition === totalRepetitions - 1) {
            $nextBtn.prop('disabled', true);
        }

        // Adiciona os botões na ordem: Anterior, Reset, Próximo para desktop
        $elements.prayerSlideNav.append($prevBtn, $resetBtn, $nextBtn);
        // Adiciona o botão reset no container mobile
        $('#resetHighlightBtnContainer').append($resetBtnMobile);

        $elements.resetHighlightBtn = $resetBtn; // Cacheia o elemento reset
    }

    function updateSlideProgress(prayerInfo) {
        $elements.prayerSlideProgress.empty(); // Limpa progresso antigo

        if (totalRepetitions > 1) {
            // Barra de progresso para repetições
            const progressPercent = ((currentRepetition + 1) / totalRepetitions) * 100;
            const $progressBar = $(`
            <span class="repetition-counter">${currentRepetition + 1}/${totalRepetitions}</span>
            <div class="prayer-progress-bar">
                <div class="prayer-progress-fill" style="width: ${progressPercent}%"></div>
            </div>
        `);
            $elements.prayerSlideProgress.append($progressBar);
        } else {
            // Progresso geral do rosário (opcional)
            const overallProgress = ((currentPrayerIndex + 1) / prayerSequence.length) * 100;
            const $overallBar = $(`
             <span class="text-sm text-gray-600">${currentPrayerIndex + 1}/${prayerSequence.length}</span>
             <div class="prayer-progress-bar">
                 <div class="prayer-progress-fill" style="width: ${overallProgress}%"></div>
             </div>
         `);
            $elements.prayerSlideProgress.append($overallBar);
        }
    }

    function startWordHighlight() {
        stopWordHighlight(); // Garante que não haja intervalos anteriores rodando
        clearTimeout(autoplayTimer); // Limpa timer anterior do autoplay
        currentWordIndex = 0;
        state.highlightFinished = false; // Reseta o estado de highlight finalizado
        if (words.length === 0) return;

        // Calcula o tempo médio por palavra (ajustável) Velocidade 1x = BASE_WPM Velocidade 2x = BASE_WPM * 1.75 (Ajustado para ser mais distinto) Velocidade 3x = BASE_WPM * 2.5 (Ajustado para ser mais distinto)
        const speedFactors = { 1: 1, 2: 1.75, 3: 2.5 };
        const effectiveWPM = BASE_WPM * (speedFactors[state.highlightSpeedMultiplier] || 1);
        const delay = (60 / effectiveWPM) * 1000; // Calcula delay em ms

        const highlightNextWord = () => {
            // Verifica PRIMEIRO se o índice ultrapassou o limite
            if (currentWordIndex >= words.length) {
                stopWordHighlight(); // Para o intervalo e remove a classe highlight atual
                state.highlightFinished = true; // Marca que o highlight terminou
                
                // Verifica se é a última oração e se o autoplay está desativado
                if (state.isLastPrayer && !state.isAutoplayActive) {
                    showFinishButton(); // Mostra o botão de conclusão
                }
                // Agenda o próximo slide APENAS se autoplay estiver ativo
                else if (state.isAutoplayActive) {
                    console.log("Autoplay: Fim do highlight, agendando próximo slide...");
                    clearTimeout(autoplayTimer); // Limpa timer antigo (precaução)
                    autoplayTimer = setTimeout(nextPrayerSlide, 1000); // Agenda avanço
                }
                return; // Encerra a execução desta chamada
            }

            // Remove highlight anterior
            $elements.prayerSlideText.find('.highlight').removeClass('highlight');

            // Adiciona highlight à palavra atual
            const $currentWordSpan = $elements.prayerSlideText.find(`.word[data-index="${currentWordIndex}"]`);
            if ($currentWordSpan.length) {
                $currentWordSpan.addClass('highlight');
                // Scroll suave para a palavra destacada
                scrollToHighlightedWord($currentWordSpan);
            }

            currentWordIndex++;
        };


        highlightNextWord(); // Destaca a primeira palavra imediatamente

        // Inicia o intervalo para as palavras SEGUINTES.
        // Limpa qualquer intervalo anterior (redundante com stopWordHighlight, mas seguro)
        if (wordHighlightInterval) clearInterval(wordHighlightInterval);
        wordHighlightInterval = setInterval(highlightNextWord, delay);
    }

    function stopWordHighlight() {
        if (wordHighlightInterval) {
            clearInterval(wordHighlightInterval);
            wordHighlightInterval = null;
        }
        $elements.prayerSlideText.find('.highlight').removeClass('highlight');
        currentWordIndex = -1;
    }

    function handleKeyPress(event) {
        if (!state.prayerSlideActive) return; // Só funciona se o slide estiver ativo

        // Ignora atalhos se as opções de velocidade estiverem abertas
        if ($elements.speedControl.hasClass('open')) return;

        switch (event.key) {
            case 'ArrowLeft':
                prevPrayerSlide();
                break;
            case 'ArrowRight':
                nextPrayerSlide();
                break;
            case 'Escape':
                closePrayerSlide();
                break;
            case '+': // Atalho para aumentar fonte
            case '=': // Teclado US
                increaseFontSize();
                break;
            case '-': // Atalho para diminuir fonte
                decreaseFontSize();
                break;
            case ' ': // Barra de espaço para pausar/retomar autoplay
                event.preventDefault(); // Impede scroll da página
                toggleAutoplay();
                break;
            case '1':
                setHighlightSpeed(1);
                break;
            case '2':
                setHighlightSpeed(2);
                break;
            case '3':
                setHighlightSpeed(3);
                break;
            case 'r': // Atalho para Reset (minúsculo)
            case 'R': // Atalho para Reset (maiúsculo)
                resetHighlight();
                break;
        }
    }

    // --- Lógica de Construção da Sequência ---
    function buildPrayerSequence() {
        prayerSequence = [];
        const langKey = state.isLatin ? 'la' : 'pt-br'; // Chave de idioma atual

        // Verifica se o tipo de mistério selecionado está ativo e existe nos dados carregados
        if (!state.currentMysteryType ||
            !state.activeMysteries[state.currentMysteryType] ||
            !prayerData.mysteries ||
            !prayerData.mysteries[langKey] ||
            !prayerData.mysteries[langKey][state.currentMysteryType])
        {
            console.error("Tentando construir sequência para um mistério inválido, inativo ou não carregado:", state.currentMysteryType);
            alert("Por favor, selecione um mistério ativo e válido para iniciar a oração.");
            return; // Aborta a construção da sequência
        }

        // Helper para adicionar oração comum à sequência
        const addCommonPrayer = (key, repetitions = 1) => {
            if (prayerData.common[key]) {
                prayerSequence.push({
                    type: 'common', // Indica que é uma oração comum
                    key: key,       // Chave da oração (ex: 'signum_crucis')
                    repetitions: repetitions
                });
            } else {
                console.warn(`Oração comum com chave '${key}' não encontrada.`);
            }
        };

        // Helper para adicionar anúncio de mistério à sequência
        const addMysteryAnnouncement = (mysteryType, mysteryIndexKey) => {
            // mysteryIndexKey: 'i', 'ii', 'iii', 'iv', 'v'
            if (prayerData.mysteries[langKey] &&
                prayerData.mysteries[langKey][mysteryType] &&
                prayerData.mysteries[langKey][mysteryType][mysteryIndexKey])
            {
                prayerSequence.push({
                    type: 'mystery_announcement', // Indica que é um anúncio
                    key: `${mysteryType}_${mysteryIndexKey}`, // Chave única para o anúncio
                    mysteryType: mysteryType,
                    mysteryIndex: mysteryIndexKey,
                    repetitions: 1
                });
            } else {
                console.warn(`Anúncio do mistério ${mysteryType} - ${mysteryIndexKey} não encontrado para o idioma ${langKey}.`);
            }
        };

        // 1. Orações Iniciais
        addCommonPrayer('signum_crucis');
        addCommonPrayer('intentios'); // Usando a chave do JSON
        addCommonPrayer('credo_niceno_constantinopolitano'); // Usando a chave do JSON
        addCommonPrayer('pater_noster');
        addCommonPrayer('ave_maria', 3); // 3x Ave Maria
        addCommonPrayer('gloria');
        addCommonPrayer('oracao_fatima'); // Usando a chave do JSON

        // 2. Cinco Mistérios
        const mysteryKeys = ['i', 'ii', 'iii', 'iv', 'v'];
        mysteryKeys.forEach(indexKey => {
            addMysteryAnnouncement(state.currentMysteryType, indexKey); // Anúncio do Mistério
            addCommonPrayer('pater_noster'); // Pai Nosso
            addCommonPrayer('ave_maria', 10); // 10x Ave Maria
            addCommonPrayer('gloria'); // Glória
            addCommonPrayer('oracao_fatima'); // Oração de Fátima
        });

        // 3. Orações Finais
        addCommonPrayer('salve_rainha'); // Usando a chave do JSON
        addCommonPrayer('signum_crucis'); // Sinal da Cruz final

        // Define o total de repetições para a primeira oração da sequência
        if (prayerSequence.length > 0) {
            totalRepetitions = prayerSequence[0].repetitions || 1;
        } else {
            totalRepetitions = 1; // Garante um valor padrão
        }

        console.log("Sequência de oração construída:", prayerSequence); // Log para depuração
    }

    // REMOVIDA: function getMysteryPrayers(type) { ... }

    // --- Funções do Modal ---
    function showLanguageModal() {
        $elements.languageModal.addClass('active');
    }

    function hideLanguageModal() {
        $elements.languageModal.removeClass('active');
    }

    // --- Funções do Modal de Conclusão ---
    function showCompletionModal() {
        $elements.completionModal.addClass('active');
    }

    function hideCompletionModal() {
        $elements.completionModal.removeClass('active');
    }

    // --- Funções de Toque (Swipe) ---
    function setupTouchEvents() {
        let touchstartX = 0;
        let touchendX = 0;
        const gestureZone = $elements.prayerSlide[0]; // Detecta swipe na área do slide

        gestureZone.addEventListener('touchstart', function (event) {
            // Ignora swipe se o toque começar nos botões de controle
            if ($(event.target).closest('.control-btn, .prayer-navigation button').length > 0) {
                touchstartX = null;
                return;
            }
            touchstartX = event.changedTouches[0].screenX;
        }, false);

        gestureZone.addEventListener('touchend', function (event) {
            if (touchstartX === null) return; // Ignora se o toque começou em um botão
            touchendX = event.changedTouches[0].screenX;
            handleSwipeGesture();
        }, false);

        function handleSwipeGesture() {
            const swipeThreshold = 50; // Mínimo de pixels para considerar swipe
            if (touchendX < touchstartX - swipeThreshold) {
                nextPrayerSlide(); // Swipe para a esquerda -> Próximo
            }
            if (touchendX > touchstartX + swipeThreshold) {
                prevPrayerSlide(); // Swipe para a direita -> Anterior
            }
        }
    }

    // --- Funções dos Controles Adicionais ---
    function increaseFontSize() {
        state.currentFontSize = Math.min(state.currentFontSize + FONT_STEP, MAX_FONT_SIZE);
        $elements.prayerSlide.css('--prayer-font-size', state.currentFontSize + 'rem');
        console.log("Font size increased to:", state.currentFontSize);
    }

    function decreaseFontSize() {
        state.currentFontSize = Math.max(state.currentFontSize - FONT_STEP, MIN_FONT_SIZE);
        $elements.prayerSlide.css('--prayer-font-size', state.currentFontSize + 'rem');
        console.log("Font size decreased to:", state.currentFontSize);
    }

    function toggleSpeedOptions() {
        $elements.speedControl.toggleClass('open');
        // Fecha o outro menu de velocidade se estiver aberto
        $elements.speedControlDesktop.removeClass('open');
    }
    
    function toggleSpeedOptionsDesktop() {
        $elements.speedControlDesktop.toggleClass('open');
        // Fecha o outro menu de velocidade se estiver aberto
        $elements.speedControl.removeClass('open');
    }

    function setHighlightSpeed(speed) {
        const newSpeed = parseInt(speed, 10);
        if (![1, 2, 3].includes(newSpeed)) return; // Valida a velocidade

        state.highlightSpeedMultiplier = newSpeed;
        setHighlightSpeedUI(newSpeed); // Atualiza UI

        // Reinicia o highlight com a nova velocidade se uma oração estiver ativa e o highlight estiver rodando
        if (state.prayerSlideActive && currentPrayerIndex >= 0 && wordHighlightInterval) {
            console.log("Reiniciando highlight com nova velocidade:", newSpeed);
            startWordHighlight(); // Reinicia com a nova velocidade
        } else if (state.prayerSlideActive && currentPrayerIndex >= 0 && !wordHighlightInterval && state.isAutoplayActive) {
            // Se o highlight estava parado (ex: fim da oração no autoplay), reinicia
            console.log("Reiniciando highlight parado com nova velocidade (autoplay):", newSpeed);
            startWordHighlight();
        }
        console.log("Velocidade do destaque definida para:", state.highlightSpeedMultiplier);
    }

    // Função separada para atualizar apenas a UI do botão de velocidade
    function setHighlightSpeedUI(speed) {
        $elements.speedOptionBtns.removeClass('selected');
        $elements.speedOptionBtns.filter(`[data-speed="${speed}"]`).addClass('selected');
    }

    function toggleAutoplay() {
        state.isAutoplayActive = !state.isAutoplayActive;
        updateAutoplayButtonUI();
        clearTimeout(autoplayTimer); // Limpa qualquer timer de avanço pendente

        if (state.isAutoplayActive && state.prayerSlideActive) {
            // Autoplay ATIVADO: Verifica se precisa iniciar/retomar o highlight ou agendar próximo slide
            if (wordHighlightInterval === null) { // Se o highlight não está rodando...
                if (currentWordIndex === -1 || currentWordIndex >= words.length) {
                    // ...e a oração acabou (ou nem começou), agenda o próximo slide
                    console.log("Autoplay: Ativado no fim/início, agendando próximo slide...");
                    autoplayTimer = setTimeout(nextPrayerSlide, 1000);
                } else {
                    // ...e a oração está pausada no meio, retoma o highlight
                    console.log("Autoplay: Retomando highlight pausado...");
                    startWordHighlight();
                }
            } else {
                // Se o highlight já está rodando, não faz nada, ele vai continuar e agendar o próximo slide quando terminar.
                console.log("Autoplay: Ativado, highlight já em andamento.");
            }
        } else {
            // Autoplay DESATIVADO: O timer já foi limpo. O highlight atual continuará até o fim da palavra, mas não agendará o próximo.
            console.log("Autoplay: Desativado.");
            // Se quiser parar o highlight imediatamente ao desativar:
            // stopWordHighlight();
        }
    }

    // Função para reiniciar o highlight da oração atual
    function resetHighlight() {
        if (!state.prayerSlideActive || currentPrayerIndex < 0) return; // Só funciona se uma oração estiver ativa

        console.log("Reiniciando highlight...");
        stopWordHighlight(); // Para qualquer highlight existente e remove classe .highlight
        clearTimeout(autoplayTimer); // Cancela qualquer avanço automático pendente
        currentWordIndex = 0; // Volta para a primeira palavra (será usado por startWordHighlight)

        // Reinicia o processo de highlight do começo da oração atual
        startWordHighlight();
    }

    // Função separada para atualizar apenas a UI do botão autoplay
    function updateAutoplayButtonUI() {
        if (state.isAutoplayActive) {
            // Mobile
            $elements.autoplayBtn.addClass('active').attr('title', 'Pausar Autoplay');
            $elements.autoplayBtn.find('i').removeClass('fa-play').addClass('fa-pause');
            // Desktop
            $elements.autoplayBtnDesktop.addClass('active').attr('title', 'Pausar Autoplay');
            $elements.autoplayBtnDesktop.find('i').removeClass('fa-play').addClass('fa-pause');
        } else {
            // Mobile
            $elements.autoplayBtn.removeClass('active').attr('title', 'Autoplay Próxima Oração');
            $elements.autoplayBtn.find('i').removeClass('fa-pause').addClass('fa-play');
            // Desktop
            $elements.autoplayBtnDesktop.removeClass('active').attr('title', 'Autoplay Próxima Oração');
            $elements.autoplayBtnDesktop.find('i').removeClass('fa-pause').addClass('fa-play');
            
            // Verifica se deve mostrar o botão de conclusão
            if (state.isLastPrayer && state.highlightFinished) {
                showFinishButton();
            }
        }
    }

    // Função para reiniciar o highlight da oração atual
    function resetHighlight() {
        if (!state.prayerSlideActive || currentPrayerIndex < 0) return; // Só funciona se uma oração estiver ativa

        console.log("Reiniciando highlight...");
        stopWordHighlight(); // Para qualquer highlight existente e remove classe .highlight
        clearTimeout(autoplayTimer); // Cancela qualquer avanço automático pendente
        currentWordIndex = 0; // Volta para a primeira palavra (será usado por startWordHighlight)

        // Reinicia o processo de highlight do começo da oração atual
        startWordHighlight();
    }

    // Função para rolar suavemente até a palavra destacada
    function scrollToHighlightedWord($wordSpan) {
        if (!$wordSpan.length) return;

        const $container = $elements.prayerSlide.find('.prayer-content');
        const containerHeight = $container.height();
        const wordTop = $wordSpan.position().top;
        const wordHeight = $wordSpan.height();
        const currentScroll = $container.scrollTop();

        // Calcula a posição ideal para manter a palavra no centro visível
        const visibleTop = containerHeight * 0.3; // 30% da altura do container (margem superior)
        const visibleBottom = containerHeight * 0.6; // 60% da altura do container (margem inferior)

        // Rola se a palavra estiver próxima do final ou do início da área visível
        if (wordTop > visibleBottom) {
            // Palavra está abaixo da área visível ideal
            const newScrollTop = currentScroll + (wordTop - visibleBottom) + wordHeight;
            $container.stop().animate({
                scrollTop: newScrollTop
            }, 300);
        } else if (wordTop < visibleTop && currentScroll > 0) {
            // Palavra está acima da área visível ideal e não estamos no topo
            const newScrollTop = currentScroll - (visibleTop - wordTop);
            $container.stop().animate({
                scrollTop: Math.max(0, newScrollTop) // Não rolar para valores negativos
            }, 300);
        }
    }

    // Função para mostrar o botão de conclusão
    function showFinishButton() {
        // Se o botão ainda não existe, cria-o
        if (!$elements.finishPrayerBtn) {
            $elements.finishPrayerBtn = $('#finishPrayerBtn');
            if ($elements.finishPrayerBtn.length === 0) {
                $elements.finishPrayerBtn = $('<button id="finishPrayerBtn" class="finish-prayer-btn" title="Concluir Rosário"><i class="fas fa-check-circle"></i></button>');
                $elements.prayerSlide.append($elements.finishPrayerBtn);
                
                // Adiciona o evento de clique
                $elements.finishPrayerBtn.on('click', function() {
                    closePrayerSlide();
                    showCompletionModal();
                });
            }
        }
        
        // Mostra o botão
        $elements.finishPrayerBtn.removeClass('hidden').addClass('active');
    }
    
    // Função para esconder o botão de conclusão
    function hideFinishButton() {
        if ($elements.finishPrayerBtn) {
            $elements.finishPrayerBtn.addClass('hidden').removeClass('active');
        }
    }

    // Inicia o carregamento dos textos
    loadPrayerTexts();
});