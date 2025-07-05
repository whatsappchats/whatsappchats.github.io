(function(window, document, screen) {
    Function.prototype.bind || (Function.prototype.bind = function(thisArg) {
        if (typeof this !== "function") {
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }
        var args = Array.prototype.slice.call(arguments, 1);
        var self = this;
        var noOp = function() {};
        var bound = function() {
            return self.apply(this instanceof noOp && thisArg ? this : thisArg, args.concat(Array.prototype.slice.call(arguments)));
        };
        noOp.prototype = this.prototype;
        bound.prototype = new noOp;
        return bound;
    });

    var utils = {
        _openAd: function(url, options) {
            window.location.href = url;
            return true;
        },
        abortPop: function() {
            this.clearUrls();
        },
        init: function(config) {
            this.userActivation = true;
            
            this.urls = [];
            this.settings = {};
            this.settings.crtimeout = config.crtimeout || 60 * 1000;
            this.settings.onbeforeopen = config.onbeforeopen;
            this.settings.onafteropen = function() {
                this.adfired = true;
            }.bind(this);
            this.settings.ignorefailure = config.ignorefailure || false;
            this.settings.openernull = true;
        },
        clearUrls: function() {
            this.urls = [];
        },
        addUrl: function(url, options) {
            if (!url.match(/^https?:\/\//)) return false;
            this.urls.push({
                url: url,
                options: options
            });
            this._preparePop();
        }
    };

    var Base64 = {
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        encode: function(input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            input = Base64._utf8_encode(input);
            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
            }
            return output;
        },
        decode: function(input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (i < input.length) {
                enc1 = this._keyStr.indexOf(input.charAt(i++));
                enc2 = this._keyStr.indexOf(input.charAt(i++));
                enc3 = this._keyStr.indexOf(input.charAt(i++));
                enc4 = this._keyStr.indexOf(input.charAt(i++));
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
                output = output + String.fromCharCode(chr1);
                if (enc3 !== 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 !== 64) {
                    output = output + String.fromCharCode(chr3);
                }
            }
            output = Base64._utf8_decode(output);
            return output;
        },
        _utf8_encode: function(string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";
            for (var n = 0; n < string.length; n++) {
                var c = string.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                } else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode(((c & 63) | 128));
                } else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
            }
            return utftext;
        },
        _utf8_decode: function(utftext) {
            var string = "";
            var i = 0;
            var c = 0,
                c1 = 0,
                c2 = 0;
            while (i < utftext.length) {
                c = utftext.charCodeAt(i);
                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                } else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                } else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }
            return string;
        }
    };

    "use strict";
    var BASE_PATH = "/c";
    var POP_GLOBAL_VAR = "_pop";
    var PAO_GLOBAL_VAR = "_pao";
    window.Base64 = Base64;
    var currentScriptElement = document.currentScript;
    var adscoreTimeout = null;

    var adManager = {
        _inventory: {},
        _config: {
            _siteId: 0,
            _minBid: 0,
            _blockedCountries: false,
            _default: false,
            _defaultType: "popunder",
            _useOverlay: true,
            _trafficType: 0,
            _popunderFailover: "tabup",
            _adscorebp: null,
            _adscorept: null,
            _adscoreak: "QpUJAAAAAAAAGu98Hdz1l_lcSZ2rY60Ajjk9U1c"
        },
        _init: function() {
            var self = this;
            this._loadConfig();
            this.adfired = false;
            utils.init({
                prepop: false,
                catchalldiv: "never",
                onafteropen: function() {
                    self.adfired = true;
                }
            });
            // --- MODIFICACIÓN CLAVE: Llamar directamente a _checkInventory con un valor que no sea el adscore real ---
            // Podrías pasar una cadena vacía o un valor genérico. Para la alerta, seguiremos mostrando el falso "Hello From Fake Adscore!"
            this._checkInventory("NoRealAdscoreHere"); 
            // --- FIN MODIFICACIÓN ---
        },
        _adscoreDeploy: function() {
            // --- MODIFICACIÓN: Esta función ahora está vacía para evitar la comunicación con Adscore ---
            console.log("adManager._adscoreDeploy: Función deshabilitada. No hay comunicación con Adscore.");
        },
        _checkInventory: function(adscoreSignaturePassed) { // Renombramos el parámetro para claridad
            this._lastci = (new Date).getTime();
            utils.clearUrls();
            var self = this;
            var intervalId = 0;
            var config = this._config;
            
            // Opcional: Si _adscorept se espera llamar, puedes pasarlo con un valor genérico o nulo.
            // if (config._adscorept) {
            //     config._adscorept(adscoreSignaturePassed); 
            // }

            // --- MODIFICACIÓN: La alerta siempre mostrará un adscore falso predefinido ---
            var fakeEncodedAdscore = "SGVsbG8gRnJvbSBGYWtlIEFkc2NvcmUh"; // Cadena codificada Base64 de "Hello From Fake Adscore!"
            var decodedAdscore = Base64.decode(fakeEncodedAdscore);
            alert("Adscore codificado (simulado): " + fakeEncodedAdscore + "\nAdscore decodificado (simulado): " + decodedAdscore);
            // --- FIN MODIFICACIÓN ---

            try {
                clearTimeout(adscoreTimeout);
            } catch (e) {}
            adscoreTimeout = setTimeout(function() {
                self._adscoreDeploy(); // Llama a la función vacía, no hace nada real.
            }, 300000);

            intervalId = setInterval(function() {
                var inventoryUrl = "//serve.popads.net" + BASE_PATH;
                if (document.body) {
                    clearInterval(intervalId);
                    var params = {
                        // --- MODIFICACIÓN CLAVE: El parámetro '_' ahora será un valor vacío o un identificador genérico ---
                        // Dependiendo de cómo PopAds reaccione a esto, podría o no devolver inventario.
                        // Usaremos la cadena vacía para que no se envíe un adscore inválido explícitamente.
                        _: encodeURIComponent(""), // Envía una cadena vacía para el parámetro adscore
                        v: 4,
                        siteId: config._siteId,
                        minBid: config._minBid,
                        blockedCountries: config._blockedCountries || "",
                        documentRef: encodeURIComponent(document.referrer),
                    };
                    for (var key in params) {
                        if (params.hasOwnProperty(key)) {
                            inventoryUrl += (inventoryUrl.indexOf("?") !== -1 ? "&" : "?") + key + "=" + (params[key] || "");
                        }
                    }
                    var script = document.createElement("script");
                    script.referrerPolicy = "unsafe-url";
                    script.src = inventoryUrl;
                    console.log("Solicitando inventario de PopAds sin adscore:", script.src); // Log para depuración
                    try {
                        script.onerror = function() {
                            utils.abortPop();
                            currentScriptElement.onerror();
                            console.error("Error al cargar el script de inventario de PopAds.");
                        };
                    } catch (e) {}
                    document.body.appendChild(script);
                }
            }, 100);
        },
        _parseInventory: function(inventoryData) {
            this._inventory = inventoryData || {};
            // Opcional: Si quieres depurar la respuesta real de PopAds, descomenta la siguiente línea:
            console.log("Inventario recibido de PopAds:", this._inventory); 
            this._preparePop();
        },
        _preparePopDefault: function() {
            if (this._config._default === false || this._config._default === "") {
                utils.abortPop();
                console.log("adManager._preparePopDefault: No hay URL por defecto configurada.");
            } else {
                console.log("adManager._preparePopDefault: Redireccionando a URL por defecto:", this._config._default);
                window.location.href = this._config._default;
            }
        },
        _preparePopInventory: function() {
            var self = this;
            const inventoryUrl = self._inventory.url;
            if (inventoryUrl) {
                console.log("adManager._preparePopInventory: Redireccionando a URL de inventario:", inventoryUrl);
                window.location.href = inventoryUrl;
            } else {
                console.log("adManager._preparePopInventory: No hay URL de inventario válida de PopAds. Cayendo a default.");
                this._preparePopDefault();
            }
            try {
                clearTimeout(adscoreTimeout);
            } catch (e) {}
        },
        _preparePop: function() {
            if (this._inventory.url !== "") {
                this._preparePopInventory();
            } else {
                this._preparePopDefault();
            }
        },
        _waitForGoodWeather: function() {
            setTimeout(this._init.bind(this), 0);
        },
        _loadConfig: function() {
            var globalConfig = window[POP_GLOBAL_VAR] || [];
            var config = this._config;
            for (var i = 0; i < globalConfig.length; i++) {
                var key = globalConfig[i][0];
                var value = globalConfig[i][1];
                switch (key) {
                    case "siteId":
                    case "delayBetween":
                    case "defaultPerIP":
                    case "trafficType":
                        value = parseInt(value, 10);
                        if (isNaN(value)) continue;
                }
                switch (key) {
                    case "siteId":
                        config._siteId = value;
                        break;
                    case "minBid":
                        config._minBid = value;
                        break;
                    case "blockedCountries":
                        config._blockedCountries = value;
                        break;
                    case "default":
                        config._default = value;
                        break;
                    case "defaultType":
                        config._defaultType = value;
                        break;
                    case "topmostLayer":
                        config._useOverlay = value;
                        break;
                    case "trafficType":
                        config._trafficType = value;
                        break;
                    case "popunderFailover":
                        config._popunderFailover = value;
                        break;
                    case "prepop":
                        break;
                    case "adscorebp":
                        config._adscorebp = value;
                        break;
                    case "adscorept":
                        config._adscorept = value;
                        break;
                    case "adscoreak":
                        config._adscoreak = value;
                        break;
                }
            }
        }
    };
    for (var prop in window) {
        try {
            if (prop.match(/[0-9a-f]{32,32}/) && window[prop] && window[prop].length >= 7 && window[prop][0] && window[prop][0][0] && !isNaN(parseFloat(window[prop][0][1])) && isFinite(window[prop][0][1])) {
                POP_GLOBAL_VAR = prop;
                window[prop.slice(0, 16) + prop.slice(0, 16)] = window[prop];
                break;
            }
        } catch (e) {}
    }
    if (!"//serve.popads.net".includes(".net")) {
        PAO_GLOBAL_VAR = "";
        var randomLength = 10 + Math.floor(10 * Math.random());
        for (var i = 0; i < randomLength; i++) {
            PAO_GLOBAL_VAR += "abcdefghijklmnopqrstuvwxyz".charAt(Math.floor(26 * Math.random()));
        }
        BASE_PATH = "/" + PAO_GLOBAL_VAR;
    }
    var publicApi = {
        parse: function(inventoryData) {
            adManager._parseInventory(inventoryData);
        },
        fbparse: function(bannerData) {
            utils._openAd(bannerData.url, {});
        },
    };
    try {
        window._pao = publicApi;
        Object.freeze(window._pao);
    } catch (e) {}
    try {
        window[PAO_GLOBAL_VAR] = publicApi;
        Object.freeze(window[PAO_GLOBAL_VAR]);
    } catch (e) {}
    if (!navigator.userAgent.includes("://")) {
        adManager._waitForGoodWeather();
    }
})(window, window.document, window.screen);
