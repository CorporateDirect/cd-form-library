(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./inputFormatting", "./formWrapperVisibility"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initFormWrapperVisibility = exports.initInputFormatting = void 0;
    // Export feature initializers
    var inputFormatting_1 = require("./inputFormatting");
    Object.defineProperty(exports, "initInputFormatting", { enumerable: true, get: function () { return inputFormatting_1.initInputFormatting; } });
    var formWrapperVisibility_1 = require("./formWrapperVisibility");
    Object.defineProperty(exports, "initFormWrapperVisibility", { enumerable: true, get: function () { return formWrapperVisibility_1.initFormWrapperVisibility; } });
});
