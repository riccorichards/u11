"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_rsc_lib_models_DisciplineLog_ts";
exports.ids = ["_rsc_lib_models_DisciplineLog_ts"];
exports.modules = {

/***/ "(rsc)/./lib/models/DisciplineLog.ts":
/*!*************************************!*\
  !*** ./lib/models/DisciplineLog.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var mongoose__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! mongoose */ \"mongoose\");\n/* harmony import */ var mongoose__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(mongoose__WEBPACK_IMPORTED_MODULE_0__);\n\nconst DISCIPLINE_TYPES = [\n    \"yellow_card\",\n    \"red_card\",\n    \"late_training\",\n    \"early_exit\",\n    \"low_coachability\",\n    \"repeated_negative_state\",\n    \"full_attendance_week\",\n    \"high_coachability_streak\"\n];\nconst DisciplineLogSchema = new mongoose__WEBPACK_IMPORTED_MODULE_0__.Schema({\n    playerId: {\n        type: mongoose__WEBPACK_IMPORTED_MODULE_0__.Schema.Types.ObjectId,\n        ref: \"Player\",\n        required: true\n    },\n    type: {\n        type: String,\n        enum: DISCIPLINE_TYPES,\n        required: true\n    },\n    date: {\n        type: String,\n        required: true\n    }\n}, {\n    timestamps: true\n});\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((mongoose__WEBPACK_IMPORTED_MODULE_0___default().models).DisciplineLog || mongoose__WEBPACK_IMPORTED_MODULE_0___default().model(\"DisciplineLog\", DisciplineLogSchema));\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvbW9kZWxzL0Rpc2NpcGxpbmVMb2cudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQTRDO0FBRTVDLE1BQU1FLG1CQUFtQjtJQUN2QjtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0NBQ0Q7QUFFRCxNQUFNQyxzQkFBc0IsSUFBSUYsNENBQU1BLENBQ3BDO0lBQ0VHLFVBQVU7UUFBRUMsTUFBTUosNENBQU1BLENBQUNLLEtBQUssQ0FBQ0MsUUFBUTtRQUFFQyxLQUFLO1FBQVVDLFVBQVU7SUFBSztJQUN2RUosTUFBTTtRQUFFQSxNQUFNSztRQUFRQyxNQUFNVDtRQUFrQk8sVUFBVTtJQUFLO0lBQzdERyxNQUFNO1FBQUVQLE1BQU1LO1FBQVFELFVBQVU7SUFBSztBQUN2QyxHQUNBO0lBQUVJLFlBQVk7QUFBSztBQUdyQixpRUFBZWIsd0RBQWUsQ0FBQ2UsYUFBYSxJQUMxQ2YscURBQWMsQ0FBQyxpQkFBaUJHLG9CQUFvQkEsRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2RpbmFtby1iYXR1bWktdTE1Ly4vbGliL21vZGVscy9EaXNjaXBsaW5lTG9nLnRzPzhlMWUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1vbmdvb3NlLCB7IFNjaGVtYSB9IGZyb20gXCJtb25nb29zZVwiO1xyXG5cclxuY29uc3QgRElTQ0lQTElORV9UWVBFUyA9IFtcclxuICBcInllbGxvd19jYXJkXCIsXHJcbiAgXCJyZWRfY2FyZFwiLFxyXG4gIFwibGF0ZV90cmFpbmluZ1wiLFxyXG4gIFwiZWFybHlfZXhpdFwiLFxyXG4gIFwibG93X2NvYWNoYWJpbGl0eVwiLFxyXG4gIFwicmVwZWF0ZWRfbmVnYXRpdmVfc3RhdGVcIixcclxuICBcImZ1bGxfYXR0ZW5kYW5jZV93ZWVrXCIsXHJcbiAgXCJoaWdoX2NvYWNoYWJpbGl0eV9zdHJlYWtcIixcclxuXSBhcyBjb25zdDtcclxuXHJcbmNvbnN0IERpc2NpcGxpbmVMb2dTY2hlbWEgPSBuZXcgU2NoZW1hKFxyXG4gIHtcclxuICAgIHBsYXllcklkOiB7IHR5cGU6IFNjaGVtYS5UeXBlcy5PYmplY3RJZCwgcmVmOiBcIlBsYXllclwiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgdHlwZTogeyB0eXBlOiBTdHJpbmcsIGVudW06IERJU0NJUExJTkVfVFlQRVMsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICBkYXRlOiB7IHR5cGU6IFN0cmluZywgcmVxdWlyZWQ6IHRydWUgfSxcclxuICB9LFxyXG4gIHsgdGltZXN0YW1wczogdHJ1ZSB9LFxyXG4pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgbW9uZ29vc2UubW9kZWxzLkRpc2NpcGxpbmVMb2cgfHxcclxuICBtb25nb29zZS5tb2RlbChcIkRpc2NpcGxpbmVMb2dcIiwgRGlzY2lwbGluZUxvZ1NjaGVtYSk7XHJcbiJdLCJuYW1lcyI6WyJtb25nb29zZSIsIlNjaGVtYSIsIkRJU0NJUExJTkVfVFlQRVMiLCJEaXNjaXBsaW5lTG9nU2NoZW1hIiwicGxheWVySWQiLCJ0eXBlIiwiVHlwZXMiLCJPYmplY3RJZCIsInJlZiIsInJlcXVpcmVkIiwiU3RyaW5nIiwiZW51bSIsImRhdGUiLCJ0aW1lc3RhbXBzIiwibW9kZWxzIiwiRGlzY2lwbGluZUxvZyIsIm1vZGVsIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/models/DisciplineLog.ts\n");

/***/ })

};
;