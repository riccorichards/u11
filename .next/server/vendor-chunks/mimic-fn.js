"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/mimic-fn";
exports.ids = ["vendor-chunks/mimic-fn"];
exports.modules = {

/***/ "(rsc)/./node_modules/mimic-fn/index.js":
/*!****************************************!*\
  !*** ./node_modules/mimic-fn/index.js ***!
  \****************************************/
/***/ ((module) => {

eval("\n\nconst mimicFn = (to, from) => {\n\tfor (const prop of Reflect.ownKeys(from)) {\n\t\tObject.defineProperty(to, prop, Object.getOwnPropertyDescriptor(from, prop));\n\t}\n\n\treturn to;\n};\n\nmodule.exports = mimicFn;\n// TODO: Remove this for the next major release\nmodule.exports[\"default\"] = mimicFn;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbWltaWMtZm4vaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQWE7O0FBRWI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseUJBQXNCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZGluYW1vLWJhdHVtaS11MTUvLi9ub2RlX21vZHVsZXMvbWltaWMtZm4vaW5kZXguanM/YjEzZCJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IG1pbWljRm4gPSAodG8sIGZyb20pID0+IHtcblx0Zm9yIChjb25zdCBwcm9wIG9mIFJlZmxlY3Qub3duS2V5cyhmcm9tKSkge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0bywgcHJvcCwgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihmcm9tLCBwcm9wKSk7XG5cdH1cblxuXHRyZXR1cm4gdG87XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1pbWljRm47XG4vLyBUT0RPOiBSZW1vdmUgdGhpcyBmb3IgdGhlIG5leHQgbWFqb3IgcmVsZWFzZVxubW9kdWxlLmV4cG9ydHMuZGVmYXVsdCA9IG1pbWljRm47XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/mimic-fn/index.js\n");

/***/ })

};
;